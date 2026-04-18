import express from 'express';
import { getDrivers, addDriver, updateDriver, getDriverPerformance } from '../controllers/driverController.js';

const router = express.Router();

router.get('/', getDrivers);
router.get('/performance', getDriverPerformance);
router.post('/', addDriver);
router.put('/:id', updateDriver);

export default router;
