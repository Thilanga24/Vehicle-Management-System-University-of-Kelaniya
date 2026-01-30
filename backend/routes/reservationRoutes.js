import express from 'express';
import { createReservation, getReservations, updateReservationStatus } from '../controllers/reservationController.js';

const router = express.Router();

router.post('/', createReservation);
router.get('/', getReservations);
router.put('/:id', updateReservationStatus);

export default router;
