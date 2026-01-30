import express from 'express';
import { getVehicles, addVehicle, updateVehicle } from '../controllers/vehicleController.js';
// import { protect, admin } from '../middleware/authMiddleware.js'; // To be implemented

const router = express.Router();

router.get('/', getVehicles);
router.post('/', addVehicle);
router.put('/:id', updateVehicle);

export default router;
