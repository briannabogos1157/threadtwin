"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_cache_1 = __importDefault(require("node-cache"));
const scraper_1 = __importDefault(require("./services/scraper"));
const similarity_1 = __importDefault(require("./services/similarity"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const cache = new node_cache_1.default({ stdTTL: 3600 }); // Cache for 1 hour
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Validate URL middleware
const validateUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch (_a) {
        return false;
    }
};
// Routes
app.post('/api/analyze', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        if (!validateUrl(url)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }
        // Check cache first
        const cachedResult = cache.get(url);
        if (cachedResult) {
            console.log('Cache hit for URL:', url);
            return res.json(cachedResult);
        }
        console.log('Analyzing product:', url);
        // Scrape product details
        const productDetails = await scraper_1.default.scrapeProduct(url);
        if (!productDetails.name) {
            return res.status(404).json({ error: 'Could not find product details' });
        }
        // Store in cache
        cache.set(url, productDetails);
        console.log('Product analysis complete:', productDetails.name);
        res.json(productDetails);
    }
    catch (error) {
        console.error('Error analyzing product:', error);
        res.status(500).json({
            error: 'Failed to analyze product',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/api/compare', async (req, res) => {
    try {
        const { originalUrl, dupeUrl } = req.body;
        if (!originalUrl || !dupeUrl) {
            return res.status(400).json({ error: 'Both URLs are required' });
        }
        if (!validateUrl(originalUrl) || !validateUrl(dupeUrl)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }
        // Check cache for both products
        const cacheKey = `${originalUrl}:${dupeUrl}`;
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
            console.log('Cache hit for comparison:', cacheKey);
            return res.json(cachedResult);
        }
        console.log('Comparing products:', { originalUrl, dupeUrl });
        // Scrape both products
        const [original, dupe] = await Promise.all([
            scraper_1.default.scrapeProduct(originalUrl),
            scraper_1.default.scrapeProduct(dupeUrl)
        ]);
        if (!original.name || !dupe.name) {
            return res.status(404).json({ error: 'Could not find product details for one or both items' });
        }
        // Calculate similarity
        const matchBreakdown = similarity_1.default.calculateSimilarity(original, dupe);
        const result = {
            original: { ...original, url: originalUrl },
            dupe: { ...dupe, url: dupeUrl },
            matchBreakdown
        };
        // Store in cache
        cache.set(cacheKey, result);
        console.log('Comparison complete:', {
            original: original.name,
            dupe: dupe.name,
            totalMatch: matchBreakdown.total
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error comparing products:', error);
        res.status(500).json({
            error: 'Failed to compare products',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
