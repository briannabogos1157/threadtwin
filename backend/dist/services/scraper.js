"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
class ProductScraper {
    async safeEval(page, selector) {
        try {
            const element = await page.$(selector);
            if (!element)
                return '';
            const text = await page.evaluate((el) => el.textContent || '', element);
            return text.trim();
        }
        catch (error) {
            console.log(`Failed to get text for selector ${selector}:`, error);
            return '';
        }
    }
    async retryOperation(operation, retries = ProductScraper.MAX_RETRIES) {
        try {
            return await operation();
        }
        catch (error) {
            if (retries > 0) {
                console.log(`Retrying operation, ${retries} attempts remaining`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between retries
                return this.retryOperation(operation, retries - 1);
            }
            throw error;
        }
    }
    async scrapeProduct(url) {
        console.log('Starting to scrape URL:', url);
        let browser;
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Scraping timeout')), ProductScraper.SCRAPE_TIMEOUT));
        try {
            browser = await puppeteer_1.default.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            await page.setDefaultNavigationTimeout(ProductScraper.PAGE_TIMEOUT);
            // Navigate with retry
            await this.retryOperation(async () => {
                await Promise.race([
                    page.goto(url, { waitUntil: 'networkidle0' }),
                    timeoutPromise
                ]);
            });
            console.log('Page loaded successfully');
            // Initialize product details
            const details = {
                name: '',
                price: 0,
                fabricComposition: [],
                construction: [],
                fit: [],
                careInstructions: [],
                images: [],
                url: url
            };
            // Log the page title for debugging
            const title = await page.title();
            console.log('Page title:', title);
            // Extract product name (common selectors)
            details.name = await this.safeEval(page, 'h1') ||
                await this.safeEval(page, '.product-name') ||
                await this.safeEval(page, '.product-title') ||
                await this.safeEval(page, '[class*="product"][class*="title"]') ||
                await this.safeEval(page, '[class*="product"][class*="name"]');
            console.log('Found product name:', details.name);
            // Extract price with better handling
            const priceText = await this.safeEval(page, '.price') ||
                await this.safeEval(page, '.product-price') ||
                await this.safeEval(page, '[class*="price"]');
            try {
                details.price = this.extractPrice(priceText);
            }
            catch (error) {
                console.warn('Failed to extract price:', error);
                details.price = 0;
            }
            // Extract product description and details
            const productDescription = await this.safeEval(page, '.product-description') ||
                await this.safeEval(page, '.details') ||
                await this.safeEval(page, '[class*="description"]') ||
                await this.safeEval(page, '[class*="details"]') ||
                await this.safeEval(page, 'p');
            console.log('Found product description length:', productDescription.length);
            console.log('Product description:', productDescription);
            // Parse fabric composition
            details.fabricComposition = this.extractKeywords(productDescription, ProductScraper.FABRIC_KEYWORDS);
            console.log('Found fabric composition:', details.fabricComposition);
            // Parse construction details
            details.construction = this.extractKeywords(productDescription, ProductScraper.CONSTRUCTION_KEYWORDS);
            console.log('Found construction details:', details.construction);
            // Parse fit details
            details.fit = this.extractKeywords(productDescription, ProductScraper.FIT_KEYWORDS);
            console.log('Found fit details:', details.fit);
            // Parse care instructions
            details.careInstructions = this.extractKeywords(productDescription, ProductScraper.CARE_KEYWORDS);
            console.log('Found care instructions:', details.careInstructions);
            // Enhanced image extraction
            try {
                const images = await page.$$eval('img[src]', imgs => imgs.map(img => {
                    const src = img.getAttribute('src');
                    const dataSrc = img.getAttribute('data-src');
                    return src || dataSrc;
                })
                    .filter((src) => src !== null &&
                    !src.includes('icon') &&
                    !src.includes('logo') &&
                    /\.(jpg|jpeg|png|webp|gif)/i.test(src)));
                // Ensure absolute URLs
                details.images = images.map(img => {
                    try {
                        return new URL(img, url).href;
                    }
                    catch (_a) {
                        return img;
                    }
                });
            }
            catch (error) {
                console.error('Failed to extract images:', error);
                details.images = [];
            }
            if (!details.name) {
                throw new Error('Could not find product name');
            }
            return details;
        }
        catch (error) {
            console.error('Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                url: url,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw new Error(`Failed to scrape product details: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            if (browser) {
                try {
                    await browser.close();
                }
                catch (error) {
                    console.error('Error closing browser:', error);
                }
            }
        }
    }
    extractPrice(priceText) {
        console.log('Extracting price from:', priceText);
        // Handle various price formats
        const cleanText = priceText.replace(/[^\d.,]/g, '');
        const match = cleanText.match(/([\d,]+\.?\d*)|(\d*\.\d+)/);
        if (!match)
            return 0;
        const price = parseFloat(match[0].replace(/,/g, ''));
        if (isNaN(price))
            return 0;
        console.log('Extracted price:', price);
        return price;
    }
    extractKeywords(text, keywords) {
        return keywords.filter(keyword => {
            const found = text.toLowerCase().includes(keyword.toLowerCase());
            if (found) {
                console.log(`Found keyword: ${keyword}`);
            }
            return found;
        });
    }
}
ProductScraper.FABRIC_KEYWORDS = [
    'cotton', 'polyester', 'nylon', 'spandex', 'elastane', 'wool',
    'silk', 'linen', 'rayon', 'viscose', 'lyocell', 'modal'
];
ProductScraper.CONSTRUCTION_KEYWORDS = [
    'ribbed', 'knit', 'woven', 'double-lined', 'lined', 'unlined',
    'structured', 'stretch', 'non-stretch', 'seamless'
];
ProductScraper.FIT_KEYWORDS = [
    'slim', 'regular', 'loose', 'oversized', 'fitted', 'relaxed',
    'straight', 'skinny', 'wide', 'cropped', 'classic'
];
ProductScraper.CARE_KEYWORDS = [
    'machine wash', 'hand wash', 'dry clean', 'tumble dry',
    'iron', 'do not bleach', 'gentle cycle', 'cold water'
];
ProductScraper.MAX_RETRIES = 3;
ProductScraper.SCRAPE_TIMEOUT = 60000; // 60 seconds
ProductScraper.PAGE_TIMEOUT = 30000; // 30 seconds
exports.default = new ProductScraper();
