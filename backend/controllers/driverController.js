import db from '../config/db.js';

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private
export const getDrivers = async (req, res) => {
    try {
        const [drivers] = await db.query('SELECT * FROM drivers ORDER BY created_at DESC');
        res.json(drivers);
    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add a driver
// @route   POST /api/drivers
// @access  Private (Admin)
export const addDriver = async (req, res) => {
    console.log('Add Driver Request Body:', req.body);

    const {
        firstName, lastName, phone, nic, address,
        licenseNumber, licenseType, licenseExpiry, experience
    } = req.body;

    // Validation
    if (!firstName || !lastName || !nic || !phone || !licenseNumber) {
        return res.status(400).json({ message: 'Required fields: First Name, Last Name, NIC, Phone, License No.' });
    }

    try {
        // Insert into drivers table
        const [result] = await db.query(
            `INSERT INTO drivers (
                first_name, last_name, nic, phone_number, address,
                license_number, license_type, license_expiry_date, years_of_experience,
                status, rating
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 5.0)`,
            [
                firstName, lastName, nic, phone, address,
                licenseNumber, licenseType, licenseExpiry, experience || 0
            ]
        );

        res.status(201).json({ message: 'Driver added successfully', driverId: result.insertId });

    } catch (error) {
        console.error('Add Driver Error:', error);
        // Handle duplicate entry error (specifically for NIC usually)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Driver with this NIC already exists' });
        }
        res.status(500).json({ message: 'Failed to add driver', error: error.message });
    }
};

// @desc    Update driver details
// @route   PUT /api/drivers/:id
// @access  Private (Admin)
export const updateDriver = async (req, res) => {
    const { id } = req.params;
    console.log(`Update Driver ${id} Request Body:`, req.body);

    const {
        firstName, lastName, phone, nic, address,
        licenseNumber, licenseType, licenseExpiry, experience, status
    } = req.body;

    try {
        // Build dynamic update query
        let updates = [];
        let params = [];

        if (firstName) { updates.push('first_name = ?'); params.push(firstName); }
        if (lastName) { updates.push('last_name = ?'); params.push(lastName); }
        if (phone) { updates.push('phone_number = ?'); params.push(phone); }
        if (nic) { updates.push('nic = ?'); params.push(nic); }
        if (address) { updates.push('address = ?'); params.push(address); }
        if (licenseNumber) { updates.push('license_number = ?'); params.push(licenseNumber); }
        if (licenseType) { updates.push('license_type = ?'); params.push(licenseType); }
        if (licenseExpiry) { updates.push('license_expiry_date = ?'); params.push(licenseExpiry); }
        if (experience !== undefined) { updates.push('years_of_experience = ?'); params.push(experience); }
        if (status) { updates.push('status = ?'); params.push(status); }

        if (updates.length === 0) {
            return res.json({ message: 'No changes to update' });
        }

        // Add ID to params
        params.push(id);

        const [result] = await db.query(
            `UPDATE drivers SET ${updates.join(', ')} WHERE driver_id = ?`,
            params
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        res.json({ message: 'Driver updated successfully' });

    } catch (error) {
        console.error('Update Driver Error:', error);
        res.status(500).json({ message: 'Failed to update driver', error: error.message });
    }
};

// @desc    Get driver performance stats
// @route   GET /api/drivers/performance
// @access  Private
export const getDriverPerformance = async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT 
                d.driver_id, 
                d.first_name, 
                d.last_name, 
                d.rating,
                COUNT(r.reservation_id) as total_trips,
                IFNULL(SUM(r.distance_km), 0) as total_distance
            FROM drivers d
            LEFT JOIN vehicles v ON d.driver_id = v.assigned_driver_id
            LEFT JOIN reservations r ON v.vehicle_id = r.vehicle_id AND r.status = 'completed'
            GROUP BY d.driver_id
            ORDER BY d.rating DESC, total_trips DESC
        `);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching driver performance:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
