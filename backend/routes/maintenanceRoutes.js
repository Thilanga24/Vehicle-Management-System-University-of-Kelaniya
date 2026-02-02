import express from 'express';
import {
    getMaintenanceRecords,
    addMaintenanceRecord,
    updateMaintenanceRecord,
    getMaintenanceStats
} from '../controllers/maintenanceController.js';

const router = express.Router();

router.get('/', getMaintenanceRecords);
router.get('/stats', getMaintenanceStats);
router.post('/', addMaintenanceRecord);
router.put('/:id', updateMaintenanceRecord);

export default router;
