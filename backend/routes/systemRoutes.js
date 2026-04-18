import express from 'express';
import { getSystemStats, getSystemLogs, performBackup, optimizeDatabase } from '../controllers/systemController.js';

const router = express.Router();

router.get('/stats', getSystemStats);
router.get('/logs', getSystemLogs);
router.post('/backup', performBackup);
router.post('/optimize', optimizeDatabase);

export default router;
