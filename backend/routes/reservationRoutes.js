import express from 'express';
import { createReservation, getReservations, updateReservationStatus } from '../controllers/reservationController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the uploads directory exists
const uploadDir = 'public/uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

const router = express.Router();

router.post('/', upload.single('attachment'), createReservation);
router.get('/', getReservations);
router.put('/:id', updateReservationStatus);

export default router;
