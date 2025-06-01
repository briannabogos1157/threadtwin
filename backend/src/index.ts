import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';
import rateLimit from 'express-rate-limit';
import scraper from './services/scraper';
import similarityScorer from './services/similarity';
import productRoutes from './routes/product.routes';

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://threadtwin.vercel.app']
    : ['http://localhost:3000', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After'],
  credentials: true
};

console.log('Configuring CORS with options:', corsOptions);

// Apply CORS first
app.use(cors(corsOptions));

// Then basic middleware
app.use(express.json());

// Cache configuration
const cache = new NodeCache({ 
  stdTTL: 3600,
  checkperiod: 120,
  useClones: false
});

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false, // Never skip rate limiting
  handler: (req: any, res: Response) => {
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil((req.rateLimit?.resetTime?.getTime() ?? Date.now()) - Date.now()) / 1000
    });
  }
});

// Apply rate limiter after other middleware
app.use(limiter);

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Global error handler:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });
  
  // Handle specific error types
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

// Validate URL middleware
const validateUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

// Add root route handler
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    status: 'API is running',
    endpoints: {
      health: '/api/health',
      analyze: '/api/analyze',
      compare: '/api/compare',
      products: '/api/products'
    }
  });
});

// Health check endpoint with detailed status
app.get('/api/health', (_req: Request, res: Response) => {
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

// Routes
app.post('/api/analyze', async (req: Request, res: Response) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  try {
    console.log('Received analyze request:', req.body);
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
    
    // Set timeout for the entire operation
    timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({ error: 'Request timeout' });
      }
    }, 30000); // 30 second timeout

    const productDetails = await scraper.scrapeProduct(url);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (!productDetails.name || productDetails.name === 'Access Denied') {
      return res.status(404).json({ error: 'Could not access product details. The website may be blocking our request.' });
    }
    
    // Store in cache
    cache.set(url, productDetails);
    console.log('Product analysis complete:', productDetails.name);
    
    return res.json(productDetails);
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    console.error('Error analyzing product:', error);
    
    return res.status(500).json({ 
      error: 'Failed to analyze product',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/compare', async (req: Request, res: Response) => {
  try {
    console.log('Received compare request:', req.body);
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
    
    // Set timeout for the entire operation
    const timeout = setTimeout(() => {
      return res.status(504).json({ error: 'Request timeout' });
    }, 60000); // 60 second timeout for comparison

    try {
      const [original, dupe] = await Promise.all([
        scraper.scrapeProduct(originalUrl),
        scraper.scrapeProduct(dupeUrl)
      ]);

      clearTimeout(timeout);

      if (!original.name || !dupe.name) {
        return res.status(404).json({ error: 'Could not find product details for one or both items' });
      }

      // Calculate similarity
      const matchBreakdown = similarityScorer.calculateSimilarity(original, dupe);

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

      return res.json(result);
    } catch (error) {
      clearTimeout(timeout);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Register routes
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}); 