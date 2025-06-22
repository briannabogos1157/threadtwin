import express from 'express';
import dupeRoutes from './dupe.routes';
import embeddingRoutes from './embedding.routes';

const router = express.Router();

router.use('/dupes', dupeRoutes);
router.use('/embedding', embeddingRoutes);

export default router; 