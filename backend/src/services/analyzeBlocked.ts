import type { BlockedProductDetails } from './blockedProductEnrichment';
import { isRetailerBlock } from '../lib/retailerBlock';

export type AnalyzeFailure = {
  ok: false;
  status: number;
  body: Record<string, unknown>;
};

export type AnalyzeSuccess<T> = {
  ok: true;
  product: T;
};

function blockedOutcome(scrapeMessage: string): AnalyzeFailure {
  return {
    ok: false,
    status: 502,
    body: {
      error: 'Failed to analyze product',
      details: scrapeMessage,
    },
  };
}

/**
 * Scrape already failed. A retailer block may use one structured Manus lookup.
 * Any other failure keeps the previous fallback. A block Manus cannot verify
 * stays on the blocked response.
 */
export async function resolveScrapeFailure<T>(args: {
  scrapeMessage: string;
  canonicalUrl: string;
  manusConfigured: boolean;
  enrichBlocked: (url: string) => Promise<BlockedProductDetails | null>;
  fallback: (url: string) => Promise<T>;
}): Promise<AnalyzeFailure | AnalyzeSuccess<BlockedProductDetails | T>> {
  if (isRetailerBlock(args.scrapeMessage)) {
    if (!args.manusConfigured) return blockedOutcome(args.scrapeMessage);
    try {
      const product = await args.enrichBlocked(args.canonicalUrl);
      if (!product?.name) return blockedOutcome(args.scrapeMessage);
      return { ok: true, product };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[analyze] blocked-page Manus fallback failed:', message);
      return blockedOutcome(args.scrapeMessage);
    }
  }

  if (!args.manusConfigured) {
    return {
      ok: false,
      status: 502,
      body: {
        error: 'Failed to analyze product',
        details: args.scrapeMessage,
        hint: 'Add MANUS_API_KEY to backend/.env for automatic fallback when sites block scraping.',
      },
    };
  }

  try {
    const product = await args.fallback(args.canonicalUrl);
    return { ok: true, product };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[analyze] Manus fallback failed:', message);
    return {
      ok: false,
      status: 502,
      body: {
        error: 'Failed to analyze product',
        details: `${args.scrapeMessage} | Manus: ${message}`,
      },
    };
  }
}
