import puppeteer from 'puppeteer';
import { ProductDetails } from '@/types/product';

class ProductScraper {
  private browser: any = null;

  async scrapeProduct(url: string): Promise<ProductDetails> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0' });

      const productDetails = await page.evaluate(() => {
        // Extract product details from the page
        const name = document.querySelector('h1')?.textContent || '';
        const price = document.querySelector('.price')?.textContent || '';
        const image = document.querySelector('img[itemprop="image"]')?.getAttribute('src') || '';
        
        // Extract fabric details
        const fabricDetails = Array.from(document.querySelectorAll('.fabric-details li'))
          .map(el => el.textContent || '')
          .filter(Boolean);

        // Extract fit details
        const fitDetails = Array.from(document.querySelectorAll('.fit-details li'))
          .map(el => el.textContent || '')
          .filter(Boolean);

        // Extract care instructions
        const careInstructions = Array.from(document.querySelectorAll('.care-instructions li'))
          .map(el => el.textContent || '')
          .filter(Boolean);

        // Extract construction details
        const constructionDetails = Array.from(document.querySelectorAll('.construction-details li'))
          .map(el => el.textContent || '')
          .filter(Boolean);

        return {
          url,
          name,
          price,
          image,
          fabric: fabricDetails,
          fit: fitDetails,
          care: careInstructions,
          construction: constructionDetails
        } as ProductDetails;
      });

      await browser.close();
      return productDetails;
    } catch (error) {
      if (browser) await browser.close();
      throw error;
    }
  }
}

export default new ProductScraper(); 