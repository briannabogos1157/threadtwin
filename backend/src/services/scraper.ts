import puppeteer, { Page } from 'puppeteer';
import { materialSummaryFrom } from './materialSummary';
import { extractProductFacts } from './productFacts';

interface ProductDetails {
  name: string;
  price: number;
  originalPrice?: number | null;
  onSale?: boolean;
  availability?: string;
  description?: string;
  fabricComposition: string[];
  /** Display string. Percentages when present, otherwise fiber names. */
  materialSummary?: string;
  construction: string[];
  fit: string[];
  careInstructions: string[];
  images: string[];
  url?: string;
}

class ProductScraper {
  private static readonly FABRIC_KEYWORDS = [
    'cotton', 'polyester', 'nylon', 'spandex', 'elastane', 'wool',
    'silk', 'linen', 'rayon', 'viscose', 'lyocell', 'modal'
  ];

  private static readonly CONSTRUCTION_KEYWORDS = [
    'ribbed', 'knit', 'woven', 'double-lined', 'lined', 'unlined',
    'structured', 'stretch', 'non-stretch', 'seamless'
  ];

  private static readonly FIT_KEYWORDS = [
    'slim', 'regular', 'loose', 'oversized', 'fitted', 'relaxed',
    'straight', 'skinny', 'wide', 'cropped', 'classic'
  ];

  private static readonly CARE_KEYWORDS = [
    'machine wash', 'hand wash', 'dry clean', 'tumble dry',
    'iron', 'do not bleach', 'gentle cycle', 'cold water'
  ];

  private static readonly MAX_RETRIES = 3;
  private static readonly PAGE_TIMEOUT = 30000; // 30 seconds

  private async safeEval(page: Page, selector: string): Promise<string> {
    try {
      const element = await page.$(selector);
      if (!element) return '';
      const text = await page.evaluate(el => el?.textContent || '', element);
      return text.trim();
    } catch (error) {
      console.log(`Failed to get text for selector ${selector}:`, error);
      return '';
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    retries = ProductScraper.MAX_RETRIES
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const blocked = /HTTP 4\d\d/.test(message);
      if (retries > 0 && !blocked) {
        console.log(`Retrying operation, ${retries} attempts remaining`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between retries
        return this.retryOperation(operation, retries - 1);
      }
      throw error;
    }
  }

  async scrapeProduct(url: string): Promise<ProductDetails> {
    console.log('Starting to scrape URL:', url);
    let browser;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36');
      await page.setExtraHTTPHeaders({ 'accept-language': 'en-US,en;q=0.9' });
      await page.setDefaultNavigationTimeout(ProductScraper.PAGE_TIMEOUT);

      const response = await this.retryOperation(async () => {
        const result = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: ProductScraper.PAGE_TIMEOUT });
        if (result && result.status() >= 400) {
          throw new Error(`Product page returned HTTP ${result.status()}`);
        }
        return result;
      });
        await page.waitForFunction(
          () => /\$\s*\d/.test(document.body?.innerText || ''),
          { timeout: 8000 }
        ).catch(() => undefined);
        await page.waitForFunction(
          () => /add to (bag|cart|basket)|sold out|out of stock|notify me|unavailable/i.test(document.body?.innerText || ''),
          { timeout: 5000 }
        ).catch(() => undefined);

      console.log('Page loaded successfully', response?.status());

      // Initialize product details
      const details: ProductDetails = {
        name: '',
        price: 0,
        fabricComposition: [],
        construction: [],
        fit: [],
        careInstructions: [],
        images: [],
        url: url
      };

      const title = await page.title();
      console.log('Page title:', title);

      const html = await page.content();
      const facts = extractProductFacts(html, url);

      details.name = facts.name ||
                    await this.safeEval(page, 'h1') ||
                    await this.safeEval(page, '.product-name') ||
                    await this.safeEval(page, '.product-title');
      if (/access denied|unusual activity|robot check|verify you are human|captcha/i.test(details.name)) {
        throw new Error('Product page blocked the request');
      }

      details.price = facts.price;
      details.originalPrice = facts.originalPrice;
      details.onSale = facts.onSale;
      details.availability = facts.availability;
      details.description = facts.description;
      details.materialSummary = facts.materialSummary;
      details.images = facts.images;
      console.log('Found product name:', details.name);
      console.log(`Selected price ${facts.price} sale=${facts.onSale} original=${facts.originalPrice ?? 'none'} availability=${facts.availability || 'unknown'}`);

      const detailText = [facts.description, facts.materialSummary].filter(Boolean).join(' ');

      // Parse fabric composition
      details.fabricComposition = this.extractKeywords(
        detailText,
        ProductScraper.FABRIC_KEYWORDS
      );
      if (!details.materialSummary) {
        details.materialSummary = materialSummaryFrom(detailText, details.fabricComposition);
      }
      console.log('Found fabric composition:', details.fabricComposition);
      console.log('Material summary:', details.materialSummary);

      // Parse construction details
      details.construction = this.extractKeywords(
        detailText,
        ProductScraper.CONSTRUCTION_KEYWORDS
      );
      console.log('Found construction details:', details.construction);

      // Parse fit details
      details.fit = this.extractKeywords(
        detailText,
        ProductScraper.FIT_KEYWORDS
      );
      console.log('Found fit details:', details.fit);

      // Parse care instructions
      details.careInstructions = this.extractKeywords(
        detailText,
        ProductScraper.CARE_KEYWORDS
      );
      console.log('Found care instructions:', details.careInstructions);

      if (!details.images.length) {
        try {
          const images = await page.$$eval('img[src]', imgs =>
            imgs.map(img => img.getAttribute('src') || img.getAttribute('data-src') || '')
              .filter(src =>
                src &&
                !src.includes('icon') &&
                !src.includes('logo') &&
                /\.(jpg|jpeg|png|webp|gif)/i.test(src)
              )
          );
          details.images = images.map(img => {
            try {
              return new URL(img, url).href;
            } catch {
              return img;
            }
          });
        } catch (error) {
          console.error('Failed to extract images:', error);
          details.images = [];
        }
      }

      if (!details.name) {
        throw new Error('Could not find product name');
      }

      return details;
    } catch (error) {
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        url: url,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Failed to scrape product details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (error) {
          console.error('Error closing browser:', error);
        }
      }
    }
  }

  private extractKeywords(text: string, keywords: string[]): string[] {
    return keywords.filter(keyword => {
      const found = text.toLowerCase().includes(keyword.toLowerCase());
      if (found) {
        console.log(`Found keyword: ${keyword}`);
      }
      return found;
    });
  }
}

export default new ProductScraper(); 