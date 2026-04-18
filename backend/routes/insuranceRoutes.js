import express from 'express';
import { getInsuranceRecords, addInsuranceRecord, updateInsuranceStatus } from '../controllers/insuranceController.js';

const router = express.Router();

router.get('/', getInsuranceRecords);
router.post('/', addInsuranceRecord);
router.put('/:id', updateInsuranceStatus);

export default router;
