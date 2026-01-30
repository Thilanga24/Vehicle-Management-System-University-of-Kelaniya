import db from '../config/db.js';

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
export const getVehicles = async (req, res) => {
    try {
        const [vehicles] = await db.query(`
            SELECT v.*, d.driver_id, CONCAT(d.first_name, ' ', d.last_name) as driver_name 
            FROM vehicles v
            LEFT JOIN drivers d ON v.assigned_driver_id = d.driver_id
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
    console.log('Add Vehicle Request Body:', req.body);
    const { registrationNumber, type, make, model, year, seatingCapacity, fuelType, status, driverId } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO vehicles (registration_number, type, make, model, year, seating_capacity, fuel_type, status, assigned_driver_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [registrationNumber, type, make, model, year, seatingCapacity, fuelType, status || 'available', driverId || null]
        );
        console.log('Vehicle Insert Result:', result);
        res.status(201).json({ message: 'Vehicle added', id: result.insertId });
    } catch (error) {
        console.error('Add Vehicle Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update vehicle status
// @route   PUT /api/vehicles/:id
// @access  Private
export const updateVehicle = async (req, res) => {
    const { id } = req.params;
    const {
        registrationNumber, type, make, model, year, seatingCapacity, fuelType,
        status, driverId, mileage
    } = req.body;

    try {
        let fields = [];
        let params = [];

        if (registrationNumber) { fields.push('registration_number = ?'); params.push(registrationNumber); }
        if (type) { fields.push('type = ?'); params.push(type); }
        if (make) { fields.push('make = ?'); params.push(make); }
        if (model) { fields.push('model = ?'); params.push(model); }
        if (year) { fields.push('year = ?'); params.push(year); }
        if (seatingCapacity) { fields.push('seating_capacity = ?'); params.push(seatingCapacity); }
        if (fuelType) { fields.push('fuel_type = ?'); params.push(fuelType); }
        if (status) { fields.push('status = ?'); params.push(status); }
        if (driverId) { fields.push('assigned_driver_id = ?'); params.push(driverId); }
        if (mileage) { fields.push('current_mileage = ?'); params.push(mileage); }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        const query = `UPDATE vehicles SET ${fields.join(', ')} WHERE vehicle_id = ?`;
        params.push(id);

        await db.query(query, params);
        res.json({ message: 'Vehicle updated successfully' });
    } catch (error) {
        console.error('Update Vehicle Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
