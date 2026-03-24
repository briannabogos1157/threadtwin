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

export async function runManusAgentTask(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('MANUS_API_KEY is not configured');
  }

  const agentProfile =
    (process.env.MANUS_AGENT_PROFILE as 'manus-1.6' | 'manus-1.6-lite' | 'manus-1.6-max') ||
    'manus-1.6-lite';

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
