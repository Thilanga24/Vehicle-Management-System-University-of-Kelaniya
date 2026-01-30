import express from 'express';
import { getDrivers } from '../controllers/driverController.js';

const router = express.Router();

router.get('/', getDrivers);

export default router;
