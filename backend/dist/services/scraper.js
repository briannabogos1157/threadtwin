"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
class ProductScraper {
    async scrapeProduct(url) {
        console.log('Starting to scrape URL:', url);
        try {
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Connection': 'keep-alive',
                },
                timeout: 10000, // 10 second timeout
            });
            console.log('Successfully fetched URL, status:', response.status);
            const $ = cheerio_1.default.load(response.data);
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
            // Extract product name (common selectors)
            details.name = $('h1').first().text().trim() ||
                $('.product-name').first().text().trim() ||
                $('.product-title').first().text().trim() ||
                $('[class*="product"][class*="title"]').first().text().trim() ||
                $('[class*="product"][class*="name"]').first().text().trim();
            console.log('Found product name:', details.name);
            // Extract price (common selectors)
            const priceText = $('.price').first().text().trim() ||
                $('.product-price').first().text().trim() ||
                $('[class*="price"]').first().text().trim();
            details.price = this.extractPrice(priceText);
            console.log('Found price:', details.price);
            // Extract product description and details
            const productDescription = $('.product-description').text() ||
                $('.details').text() ||
                $('[class*="description"]').text() ||
                $('[class*="details"]').text() ||
                $('p').text();
            console.log('Found product description length:', productDescription.length);
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
            // Extract product images
            $('img').each((_, element) => {
                const src = $(element).attr('src');
                if (src && this.isProductImage(src)) {
                    details.images.push(src);
                }
            });
            console.log('Found number of images:', details.images.length);
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
    }
    extractPrice(priceText) {
        console.log('Extracting price from:', priceText);
        const match = priceText.match(/[\d,.]+/);
        const price = match ? parseFloat(match[0].replace(/,/g, '')) : 0;
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
    isProductImage(url) {
        // Filter out small icons, logos, etc.
        const isProduct = url.includes('product') ||
            url.includes('gallery') ||
            url.includes('images') ||
            url.match(/\.(jpg|jpeg|png|webp)/i) !== null;
        if (isProduct) {
            console.log('Found product image:', url);
        }
        return isProduct;
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
exports.default = new ProductScraper();
