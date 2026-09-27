import dotenv from 'dotenv';
import type { Product } from '../types/product';

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

/** Drop the live key if a client error echoes the header value. */
export function redactSecret(message: string, secret: string | undefined): string {
  if (!secret || !message.includes(secret)) return message;
  return message.split(secret).join('[redacted]');
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

function extractJsonValue(text: string): unknown {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fence ? fence[1] : text).trim();
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function manusHeaders(apiKey: string): Record<string, string> {
  return {
    accept: 'application/json',
    'content-type': 'application/json',
    API_KEY: apiKey,
  };
}

/** POST /v1/tasks. Returns as soon as Manus accepts the job. */
export async function createManusTask(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('MANUS_API_KEY is not configured');
  }

  const agentProfile =
    (process.env.MANUS_AGENT_PROFILE as 'manus-1.6' | 'manus-1.6-lite' | 'manus-1.6-max') ||
    'manus-1.6-lite';

  const createRes = await fetch(`${MANUS_API}/tasks`, {
    method: 'POST',
    headers: manusHeaders(apiKey),
    body: JSON.stringify({
      prompt,
      agentProfile,
      taskMode: 'agent',
    }),
    signal: AbortSignal.timeout(20_000),
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
  return taskId;
}

/** GET /v1/tasks/{task_id}. One status read; it does not wait for completion. */
export async function fetchManusTask(taskId: string): Promise<ManusTaskResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('MANUS_API_KEY is not configured');
  }

  const getRes = await fetch(`${MANUS_API}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'GET',
    headers: manusHeaders(apiKey),
    signal: AbortSignal.timeout(15_000),
  });

  if (!getRes.ok) {
    const errBody = await getRes.text();
    throw new Error(`Manus get task failed: ${getRes.status} ${errBody}`);
  }

  return (await getRes.json()) as ManusTaskResponse;
}

export function manusTaskText(task: ManusTaskResponse): string {
  return collectAssistantText(task);
}

export interface DupeManusRead {
  phase: 'searching' | 'failed' | 'finished';
  error?: string;
  assistantText: string;
  structured: { success: boolean; value: unknown; error?: string | null } | null;
}

const DUPE_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['products'],
  properties: {
    products: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'name',
          'retailer',
          'url',
          'imageUrl',
          'currentPrice',
          'originalPrice',
          'currency',
          'fabric',
          'fit',
          'construction',
          'care',
          'availability',
        ],
        properties: {
          name: { type: 'string' },
          retailer: { type: 'string' },
          url: { type: 'string' },
          imageUrl: { type: ['string', 'null'] },
          currentPrice: { type: ['number', 'null'] },
          originalPrice: { type: ['number', 'null'] },
          currency: { type: ['string', 'null'] },
          fabric: { type: ['string', 'null'] },
          fit: { type: ['string', 'null'] },
          construction: { type: 'array', items: { type: 'string' } },
          care: { type: 'array', items: { type: 'string' } },
          availability: {
            type: 'string',
            enum: ['in_stock', 'out_of_stock', 'unknown'],
          },
        },
      },
    },
  },
};

async function manusV2(path: string, init?: RequestInit): Promise<unknown> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('MANUS_API_KEY is not configured');
  let response: Response;
  try {
    response = await fetch(`${MANUS_API.replace('/v1', '')}/v2/${path}`, {
      ...init,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-manus-api-key': apiKey,
        ...(init?.headers || {}),
      },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(redactSecret(message, apiKey));
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok || (body && typeof body === 'object' && (body as { ok?: boolean }).ok === false)) {
    const message = body && typeof body === 'object'
      ? JSON.stringify((body as { error?: unknown }).error || body)
      : '';
    throw new Error(redactSecret(`Manus ${path.split('?')[0]} failed: ${response.status} ${message}`, apiKey));
  }
  return body;
}

/** v2 task.create with a JSON schema. Returns when Manus accepts the job. */
export async function createManusDupeTask(prompt: string): Promise<string> {
  const created = await manusV2('task.create', {
    method: 'POST',
    body: JSON.stringify({
      message: { content: prompt },
      agent_profile: 'standard',
      interactive_mode: false,
      structured_output_schema: DUPE_OUTPUT_SCHEMA,
    }),
  }) as { task_id?: string };
  if (!created.task_id) throw new Error('Manus response missing task id');
  return created.task_id;
}

function messageText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return '';
  return value.map((part) => {
    if (!part || typeof part !== 'object') return '';
    const record = part as { text?: unknown };
    return typeof record.text === 'string' ? record.text : '';
  }).filter(Boolean).join('\n');
}

/** One v2 status read. stopped is finished only when the answer event is present or absent for good. */
export async function readManusDupeTask(taskId: string): Promise<DupeManusRead> {
  const messages: unknown[] = [];
  let cursor = '';
  for (let page = 0; page < 6; page += 1) {
    const query = new URLSearchParams({ task_id: taskId, order: 'asc', limit: '100' });
    if (cursor) query.set('cursor', cursor);
    const listed = await manusV2(`task.listMessages?${query.toString()}`) as {
      messages?: unknown[];
      has_more?: boolean;
      next_cursor?: string;
    };
    if (Array.isArray(listed.messages)) messages.push(...listed.messages);
    if (!listed.has_more || !listed.next_cursor) break;
    cursor = listed.next_cursor;
  }
  let phase: DupeManusRead['phase'] = 'searching';
  let error = '';
  const assistant: string[] = [];
  let structured: DupeManusRead['structured'] = null;

  for (const message of messages) {
    if (!message || typeof message !== 'object') continue;
    const record = message as Record<string, unknown>;
    const statusUpdate = record.status_update;
    if (statusUpdate && typeof statusUpdate === 'object') {
      const update = statusUpdate as { agent_status?: string; status_detail?: { waiting_for_event_type?: string } };
      if (update.agent_status === 'running') phase = 'searching';
      if (update.agent_status === 'waiting') {
        phase = 'searching';
        console.log('Dupe search waiting:', taskId, update.status_detail?.waiting_for_event_type || 'input');
      }
      if (update.agent_status === 'error') phase = 'failed';
      if (update.agent_status === 'stopped') phase = 'finished';
    }
    const assistantMessage = record.assistant_message;
    if (assistantMessage && typeof assistantMessage === 'object') {
      const text = messageText((assistantMessage as { content?: unknown }).content);
      if (text) assistant.push(text);
    }
    const errorMessage = record.error_message;
    if (errorMessage && typeof errorMessage === 'object') {
      const recordError = errorMessage as { error?: unknown; message?: unknown; content?: unknown };
      error = String(recordError.error || recordError.message || recordError.content || 'Manus task failed');
      phase = 'failed';
    }
    const extracted = record.structured_output_result;
    if (extracted && typeof extracted === 'object') {
      const result = extracted as { success?: boolean; value?: unknown; error?: string | null };
      structured = {
        success: result.success === true,
        value: result.value,
        error: result.error,
      };
    }
  }

  if (phase === 'searching') {
    return { phase, assistantText: '', structured: null };
  }
  if (phase === 'failed') {
    return { phase, error: error || 'Manus task failed', assistantText: '', structured: null };
  }
  return {
    phase: 'finished',
    assistantText: assistant.join('\n').trim(),
    structured,
  };
}

export async function runManusAgentTask(prompt: string): Promise<string> {
  const taskId = await createManusTask(prompt);
  const maxWaitMs = Number(process.env.MANUS_TASK_MAX_WAIT_MS) || 420_000;
  const pollIntervalMs = Number(process.env.MANUS_POLL_INTERVAL_MS) || 4_000;
  const started = Date.now();

  while (Date.now() - started < maxWaitMs) {
    await sleep(pollIntervalMs);
    const task = await fetchManusTask(taskId);

    if (task.status === 'failed') {
      throw new Error(task.error || 'Manus task failed');
    }

    if (task.status === 'completed') {
      return collectAssistantText(task);
    }
  }

  throw new Error('Manus task timed out waiting for completion');
}

function parseDupesFromText(text: string): DupeMatch[] {
  const parsed = extractJsonValue(text);
  if (!parsed) return [];

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
  const prompt = `You are a fashion research agent. Find real, currently shoppable affordable alternatives ("dupes") for this luxury or high-end item:

"${luxuryItem}"

Search the web if needed. Return exactly 3 to 5 dupes from mainstream retailers (e.g. H&M, Zara, ASOS, Nordstrom Rack, Target, Amazon fashion brands).

Respond with ONLY valid JSON (no markdown outside the JSON) in this exact shape:
{"dupes":[{"title":"string","retailer":"string","price":"string with currency","description":"string — materials, silhouette, why it matches","link":"https://... full product URL"}]}

Rules:
- Each link must be a real product page URL you verified or found via search.
- Prices should be approximate if exact price unknown (e.g. "~$45").
- Do not invent fake domains; use real retailer URLs only.`;

  const text = await runManusAgentTask(prompt);
  const dupes = normalizeDupes(parseDupesFromText(text));
  if (dupes.length === 0) {
    throw new Error('Manus completed but no dupes could be parsed from output');
  }
  return dupes;
}

function parseProductsFromManusText(text: string): Omit<Product, 'id'>[] {
  const parsed = extractJsonValue(text);
  if (!parsed) return [];

  const list = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && 'products' in parsed
      ? (parsed as { products: unknown }).products
      : [];

  if (!Array.isArray(list)) return [];

  const out: Omit<Product, 'id'>[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const title = String(o.title ?? o.name ?? '').trim();
    const brand = String(o.brand ?? o.retailer ?? 'Unknown').trim();
    const imageUrl = String(o.imageUrl ?? o.image ?? o.image_url ?? '').trim();
    const productUrl = String(o.productUrl ?? o.url ?? o.link ?? '').trim();
    if (!title || !productUrl) continue;

    const priceRaw = o.price ?? o.retail_price ?? '0';
    const price =
      typeof priceRaw === 'number' ? String(priceRaw) : String(priceRaw).trim() || '0';

    const description = String(o.description ?? '').trim();
    const affiliateLink = String(o.affiliateLink ?? o.affiliate_link ?? productUrl).trim();
    const fabric = String(o.fabric ?? 'Unknown').trim();
    const category = String(o.category ?? '').trim();

    out.push({
      title,
      description,
      price,
      currency: String(o.currency ?? 'USD').trim() || 'USD',
      brand,
      imageUrl: imageUrl || 'https://placehold.co/400x600/e2e8f0/64748b?text=Product',
      productUrl,
      affiliateLink,
      tags: category ? [category] : [],
      fabric,
    });
  }
  return out.slice(0, 20);
}

/** Matches scraper output for `POST /api/analyze`. */
export interface AnalyzedProductScrapeShape {
  name: string;
  price: number;
  fabricComposition: string[];
  construction: string[];
  fit: string[];
  careInstructions: string[];
  images: string[];
  url?: string;
}

function toStringList(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof v === 'string' && v.trim()) {
    return v
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function toImageList(parsed: Record<string, unknown>, primary: string): string[] {
  if (primary && /^https?:\/\//i.test(primary)) {
    return [primary];
  }
  const imgs = parsed.images;
  if (Array.isArray(imgs)) {
    return imgs
      .filter((x): x is string => typeof x === 'string' && /^https?:\/\//i.test(x))
      .map((s) => s.trim());
  }
  return [];
}

/**
 * When Puppeteer is blocked, Manus can still research the product URL.
 */
export async function analyzeProductUrlWithManus(
  productUrl: string
): Promise<AnalyzedProductScrapeShape> {
  const prompt = `Analyze this e-commerce product page (fashion / apparel when relevant).

Product URL: ${productUrl}

Use web search or browsing to extract what a shopper would see. Return ONLY valid JSON (no markdown fences) in exactly this shape:
{"name":"string","price":0,"description":"string","imageUrl":"https://...","fabricComposition":[],"construction":[],"fit":[],"careInstructions":[]}

Rules:
- name: required, non-empty product title.
- price: number (use 0 if unknown or "see site").
- Arrays: use [] if unknown; otherwise short keyword strings.
- imageUrl: main product image URL, or "" if none.`;

  const text = await runManusAgentTask(prompt);
  const parsed = extractJsonValue(text) as Record<string, unknown> | null;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Manus returned unparseable product JSON');
  }

  const name = String(parsed.name ?? parsed.title ?? '').trim();
  if (!name) {
    throw new Error('Manus returned an empty product name');
  }

  const priceRaw = parsed.price;
  const price =
    typeof priceRaw === 'number' && !Number.isNaN(priceRaw)
      ? priceRaw
      : parseFloat(String(priceRaw ?? '0').replace(/[^\d.]/g, '')) || 0;

  const imageUrl = String(parsed.imageUrl ?? parsed.image ?? '').trim();

  return {
    name,
    price,
    fabricComposition: toStringList(parsed.fabricComposition ?? parsed.fabric),
    construction: toStringList(parsed.construction),
    fit: toStringList(parsed.fit),
    careInstructions: toStringList(parsed.careInstructions ?? parsed.care),
    images: toImageList(parsed, imageUrl),
    url: productUrl,
  };
}

/** Curate or search shoppable fashion products via Manus (no database). */
export async function fetchProductsWithManus(searchQuery?: string): Promise<Omit<Product, 'id'>[]> {
  const q = searchQuery?.trim();
  const focus = q
    ? `The shopper asked for: "${q}". Prioritize products that match this request (style, category, occasion, or brand vibe). `
    : '';

  const prompt = `${focus}You are a fashion commerce researcher. Find real, currently listed products. Return ONLY valid JSON (no markdown fences) with this exact shape:
{"products":[{"title":"string","brand":"string","price":"string","description":"short string","imageUrl":"https://...","productUrl":"https://...","affiliateLink":"https://...","fabric":"optional","category":"optional"}]}

Include ${q ? '6 to 12' : '8 to 12'} products. Every URL must be a real product page on a legitimate retailer. Do not use example.com or placeholder links.`;

  const text = await runManusAgentTask(prompt);
  const products = parseProductsFromManusText(text);
  if (products.length === 0) {
    throw new Error('Manus completed but no products could be parsed from output');
  }
  return products;
}
