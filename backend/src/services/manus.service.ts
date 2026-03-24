import dotenv from 'dotenv';

dotenv.config();

const MANUS_API = 'https://api.manus.ai/v1';

export interface DupeMatch {
  title: string;
  retailer: string;
  price: string;
  description: string;
  link: string;
}

interface ManusCreateTaskResponse {
  task_id?: string;
  id?: string;
  task_title?: string;
  task_url?: string;
}

interface MessageContent {
  type?: string;
  text?: string;
}

interface TaskMessage {
  role?: string;
  type?: string;
  content?: MessageContent[];
}

interface ManusTaskResponse {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  output?: TaskMessage[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiKey(): string | undefined {
  return process.env.MANUS_API_KEY?.trim();
}

function collectAssistantText(task: ManusTaskResponse): string {
  if (!task.output?.length) return '';
  const chunks: string[] = [];
  for (const msg of task.output) {
    if (msg.role !== 'assistant' || !msg.content?.length) continue;
    for (const part of msg.content) {
      if (part.type === 'output_text' && part.text) {
        chunks.push(part.text);
      } else if (part.text && !part.type) {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join('\n').trim();
}

function parseDupesFromText(text: string): DupeMatch[] {
  if (!text) return [];

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fence ? fence[1] : text).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end <= start) return [];
    try {
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch {
      return [];
    }
  }

  const list = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && 'dupes' in parsed
      ? (parsed as { dupes: unknown }).dupes
      : [];

  if (!Array.isArray(list)) return [];

  const out: DupeMatch[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const title = String(o.title ?? o.name ?? '').trim();
    const retailer = String(o.retailer ?? o.store ?? o.brand ?? '').trim();
    const price = String(o.price ?? '').trim();
    const description = String(o.description ?? o.summary ?? '').trim();
    const link = String(
      o.link ?? o.productLink ?? o.url ?? o.product_url ?? ''
    ).trim();
    if (title && link) {
      out.push({ title, retailer, price, description, link });
    }
  }
  return out;
}

function normalizeDupes(items: DupeMatch[]): DupeMatch[] {
  return items.slice(0, 8);
}

export function isManusConfigured(): boolean {
  return Boolean(getApiKey());
}

export async function findDupesWithManus(luxuryItem: string): Promise<DupeMatch[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('MANUS_API_KEY is not configured');
  }

  const agentProfile =
    (process.env.MANUS_AGENT_PROFILE as 'manus-1.6' | 'manus-1.6-lite' | 'manus-1.6-max') ||
    'manus-1.6-lite';

  const prompt = `You are a fashion research agent. Find real, currently shoppable affordable alternatives ("dupes") for this luxury or high-end item:

"${luxuryItem}"

Search the web if needed. Return exactly 3 to 5 dupes from mainstream retailers (e.g. H&M, Zara, ASOS, Nordstrom Rack, Target, Amazon fashion brands).

Respond with ONLY valid JSON (no markdown outside the JSON) in this exact shape:
{"dupes":[{"title":"string","retailer":"string","price":"string with currency","description":"string — materials, silhouette, why it matches","link":"https://... full product URL"}]}

Rules:
- Each link must be a real product page URL you verified or found via search.
- Prices should be approximate if exact price unknown (e.g. "~$45").
- Do not invent fake domains; use real retailer URLs only.`;

  const createRes = await fetch(`${MANUS_API}/tasks`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      API_KEY: apiKey,
    },
    body: JSON.stringify({
      prompt,
      agentProfile,
      taskMode: 'agent',
    }),
  });

  if (!createRes.ok) {
    const errBody = await createRes.text();
    throw new Error(`Manus create task failed: ${createRes.status} ${errBody}`);
  }

  const created = (await createRes.json()) as ManusCreateTaskResponse;
  const taskId = created.task_id || created.id;
  if (!taskId) {
    throw new Error('Manus response missing task id');
  }

  const maxWaitMs = Number(process.env.MANUS_TASK_MAX_WAIT_MS) || 420_000;
  const pollIntervalMs = Number(process.env.MANUS_POLL_INTERVAL_MS) || 4_000;
  const started = Date.now();

  while (Date.now() - started < maxWaitMs) {
    await sleep(pollIntervalMs);

    const getRes = await fetch(`${MANUS_API}/tasks/${encodeURIComponent(taskId)}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        API_KEY: apiKey,
      },
    });

    if (!getRes.ok) {
      const errBody = await getRes.text();
      throw new Error(`Manus get task failed: ${getRes.status} ${errBody}`);
    }

    const task = (await getRes.json()) as ManusTaskResponse;

    if (task.status === 'failed') {
      throw new Error(task.error || 'Manus task failed');
    }

    if (task.status === 'completed') {
      const text = collectAssistantText(task);
      const dupes = normalizeDupes(parseDupesFromText(text));
      if (dupes.length === 0) {
        throw new Error('Manus completed but no dupes could be parsed from output');
      }
      return dupes;
    }
  }

  throw new Error('Manus task timed out waiting for completion');
}
