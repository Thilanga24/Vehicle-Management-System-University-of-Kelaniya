import express from 'express';
import { addFuelRecord, getFuelRecords, getFuelReport } from '../controllers/fuelController.js';

const router = express.Router();

router.post('/', addFuelRecord);
router.get('/', getFuelRecords);
router.get('/report', getFuelReport);

export default router;
