import puppeteer from 'puppeteer';

interface ProductDetails {
  name: string;
  price: string;
  image: string;
  fabric: string[];
  fit: string[];
  care: string[];
  construction: string[];
}

async function scrapeProduct(url: string): Promise<ProductDetails> {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions'
      ]
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(30000);
    
    // Minimize memory usage
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (
        request.resourceType() === 'image' ||
        request.resourceType() === 'stylesheet' ||
        request.resourceType() === 'font'
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Create a timeout promise
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Scraping timeout')), 30000);
    });

    // Race between the scraping and timeout
    const productDetails = await Promise.race([
      (async () => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const details: ProductDetails = {
          name: await extractText(page, 'h1, .product-name, .product-title'),
          price: await extractText(page, '.price, .product-price'),
          image: await extractImage(page),
          fabric: await extractList(page, '.fabric-details li, .materials li'),
          fit: await extractList(page, '.fit-details li, .fit li'),
          care: await extractList(page, '.care-instructions li, .care li'),
          construction: await extractList(page, '.construction-details li, .construction li')
        };

        if (!details.name) {
          throw new Error('Could not find product name');
        }

        return details;
      })(),
      timeout
    ]);

    return productDetails;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Scraping timeout') {
        throw new Error('Product scraping timed out. Please try again.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred while scraping the product.');
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

async function extractText(page: puppeteer.Page, selector: string): Promise<string> {
  try {
    const element = await page.$(selector);
    if (!element) return '';
    const text = await page.evaluate(el => el.textContent || '', element);
    return text.trim();
  } catch {
    return '';
  }
}

async function extractImage(page: puppeteer.Page): Promise<string> {
  try {
    const imgSrc = await page.evaluate(() => {
      const img = document.querySelector('img.product-image, .product-img img');
      return img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';
    });
    return imgSrc;
  } catch {
    return '';
  }
}

async function extractList(page: puppeteer.Page, selector: string): Promise<string[]> {
  try {
    const items = await page.evaluate((sel) => {
      const elements = document.querySelectorAll(sel);
      return Array.from(elements).map(el => el.textContent || '').filter(text => text.trim());
    }, selector);
    return items;
  } catch {
    return [];
  }
}

export default {
  scrapeProduct
}; 