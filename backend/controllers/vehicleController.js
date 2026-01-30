import db from '../config/db.js';

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
export const getVehicles = async (req, res) => {
    try {
        const [vehicles] = await db.query(`
            SELECT v.*, d.driver_id, u.first_name as driver_name 
            FROM vehicles v
            LEFT JOIN drivers d ON v.assigned_driver_id = d.driver_id
            LEFT JOIN users u ON d.user_id = u.user_id
        `);
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add a vehicle
// @route   POST /api/vehicles
// @access  Private (Admin)
export const addVehicle = async (req, res) => {
    const { registrationNumber, type, make, model, year, seatingCapacity, fuelType, status } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO vehicles (registration_number, type, make, model, year, seating_capacity, fuel_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [registrationNumber, type, make, model, year, seatingCapacity, fuelType, status || 'available']
        );
        res.status(201).json({ message: 'Vehicle added', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update vehicle status
// @route   PUT /api/vehicles/:id
// @access  Private
export const updateVehicle = async (req, res) => {
    const { id } = req.params;
    const { status, driverId, currentMileage } = req.body;

    try {
        let query = 'UPDATE vehicles SET ';
        const params = [];

        if (status) {
            query += 'status = ?, ';
            params.push(status);
        }
        if (driverId) {
            query += 'assigned_driver_id = ?, ';
            params.push(driverId);
        }
        if (currentMileage) {
            query += 'current_mileage = ?, ';
            params.push(currentMileage);
        }

        // Remove trailing comma
        query = query.slice(0, -2);
        query += ' WHERE vehicle_id = ?';
        params.push(id);

        await db.query(query, params);
        res.json({ message: 'Vehicle updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
