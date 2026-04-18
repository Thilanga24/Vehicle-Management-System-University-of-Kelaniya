import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import fuelRoutes from './routes/fuelRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import insuranceRoutes from './routes/insuranceRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/insurance', insuranceRoutes);

// Root Endpoint
app.get('/', (req, res) => {
    res.send('Vehicle Management System API is running...');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
