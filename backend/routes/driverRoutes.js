import express from 'express';
import { getDrivers, addDriver, updateDriver } from '../controllers/driverController.js';

const router = express.Router();

router.get('/', getDrivers);
router.post('/', addDriver);
router.put('/:id', updateDriver);

export default router;
