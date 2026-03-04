import express from 'express';
import {
    getMaintenanceRecords,
    addMaintenanceRecord,
    updateMaintenanceRecord,
    getMaintenanceStats,
    getMaintenanceDailyCosts,
    getMaintenanceReport
} from '../controllers/maintenanceController.js';

const router = express.Router();

router.get('/', getMaintenanceRecords);
router.get('/stats', getMaintenanceStats);
router.get('/daily-costs', getMaintenanceDailyCosts);
router.get('/report', getMaintenanceReport);
router.post('/', addMaintenanceRecord);
router.put('/:id', updateMaintenanceRecord);

export default router;
