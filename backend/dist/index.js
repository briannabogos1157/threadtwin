"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_cache_1 = __importDefault(require("node-cache"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const scraper_1 = __importDefault(require("./services/scraper"));
const similarity_1 = __importDefault(require("./services/similarity"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const cache = new node_cache_1.default({
    stdTTL: 3600,
    checkperiod: 120,
    useClones: false
});
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(limiter);
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
app.use((err, req, res, _next) => {
    console.error('Global error handler:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body
    });
    if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) {
        return res.status(503).json({
            error: 'Service temporarily unavailable',
            details: 'Failed to connect to external service'
        });
    }
    if (err.message.includes('timeout')) {
        return res.status(504).json({
            error: 'Gateway timeout',
            details: 'Request took too long to process'
        });
    }
    return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
});
const validateUrl = (url) => {
    try {
        const parsedUrl = new URL(url);
        return ['http:', 'https:'].includes(parsedUrl.protocol);
    }
    catch (_a) {
        return false;
    }
};
app.get('/api/health', (_req, res) => {
    const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        cache: {
            keys: cache.keys().length,
            stats: cache.getStats()
        }
    };
    res.json(status);
});
app.post('/api/analyze', async (req, res, next) => {
    try {
        console.log('Received analyze request:', req.body);
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        if (!validateUrl(url)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }
        const cachedResult = cache.get(url);
        if (cachedResult) {
            console.log('Cache hit for URL:', url);
            return res.json(cachedResult);
        }
        console.log('Analyzing product:', url);
        const timeout = setTimeout(() => {
            return res.status(504).json({ error: 'Request timeout' });
        }, 30000);
        try {
            const productDetails = await scraper_1.default.scrapeProduct(url);
            clearTimeout(timeout);
            if (!productDetails.name) {
                return res.status(404).json({ error: 'Could not find product details' });
            }
            cache.set(url, productDetails);
            console.log('Product analysis complete:', productDetails.name);
            return res.json(productDetails);
        }
        catch (error) {
            clearTimeout(timeout);
            next(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    catch (error) {
        next(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/compare', async (req, res, next) => {
    try {
        console.log('Received compare request:', req.body);
        const { originalUrl, dupeUrl } = req.body;
        if (!originalUrl || !dupeUrl) {
            return res.status(400).json({ error: 'Both URLs are required' });
        }
        if (!validateUrl(originalUrl) || !validateUrl(dupeUrl)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }
        const cacheKey = `${originalUrl}:${dupeUrl}`;
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
            console.log('Cache hit for comparison:', cacheKey);
            return res.json(cachedResult);
        }
        console.log('Comparing products:', { originalUrl, dupeUrl });
        const timeout = setTimeout(() => {
            return res.status(504).json({ error: 'Request timeout' });
        }, 60000);
        try {
            const [original, dupe] = await Promise.all([
                scraper_1.default.scrapeProduct(originalUrl),
                scraper_1.default.scrapeProduct(dupeUrl)
            ]);
            clearTimeout(timeout);
            if (!original.name || !dupe.name) {
                return res.status(404).json({ error: 'Could not find product details for one or both items' });
            }
            const matchBreakdown = similarity_1.default.calculateSimilarity(original, dupe);
            const result = {
                original: Object.assign(Object.assign({}, original), { url: originalUrl }),
                dupe: Object.assign(Object.assign({}, dupe), { url: dupeUrl }),
                matchBreakdown
            };
            cache.set(cacheKey, result);
            console.log('Comparison complete:', {
                original: original.name,
                dupe: dupe.name,
                totalMatch: matchBreakdown.total
            });
            return res.json(result);
        }
        catch (error) {
            clearTimeout(timeout);
            next(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    catch (error) {
        next(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map