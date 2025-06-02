import express from 'express';
import dupeRoutes from './dupe.routes';

const router = express.Router();

router.use('/dupes', dupeRoutes);

export default router; 