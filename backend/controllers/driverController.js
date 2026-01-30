import db from '../config/db.js';

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private
export const getDrivers = async (req, res) => {
    try {
        const [drivers] = await db.query(`
            SELECT d.*, u.first_name, u.last_name, u.email, u.phone_number 
            FROM drivers d
            JOIN users u ON d.user_id = u.user_id
        `);
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add a driver
// @route   POST /api/drivers
// @access  Private (Admin)
export const addDriver = async (req, res) => {
    console.log('Add Driver Request Body:', req.body); // Debug log

    const {
        firstName, lastName, phone, nic, address,
        licenseNumber, licenseType, licenseExpiry, experience
    } = req.body;

    // Validation
    if (!firstName || !lastName || !nic) {
        return res.status(400).json({ message: 'First Name, Last Name, and NIC are required' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Auto-generate email based on NIC
        const email = `${nic}@driver.local`;
        // Generate pseudo Employee ID
        const employeeId = `DRV-${Date.now().toString().slice(-6)}`;

        // Default hash for 'password123'
        const defaultHash = '$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789012345';

        // 1. Create User
        // Note: Using password_hash, employee_id. Removed address/nic from users.
        const [userResult] = await connection.query(
            `INSERT INTO users (employee_id, first_name, last_name, email, password_hash, role, phone_number) 
             VALUES (?, ?, ?, ?, ?, 'driver', ?)`,
            [employeeId, firstName, lastName, email, defaultHash, phone]
        );

        const userId = userResult.insertId;

        // 2. Create Driver Profile
        // Removed status, rating, and years_of_experience to match current DB schema
        await connection.query(
            `INSERT INTO drivers (user_id, nic, license_number, license_type, license_expiry_date, address)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, nic, licenseNumber, licenseType, licenseExpiry, address]
        );

        await connection.commit();
        res.status(201).json({ message: 'Driver added successfully', driverId: userId });

    } catch (error) {
        await connection.rollback();
        console.error('Add Driver Error:', error);
        res.status(500).json({ message: 'Failed to add driver', error: error.message });
    } finally {
        connection.release();
    }
};

// @desc    Update driver details
// @route   PUT /api/drivers/:id
// @access  Private (Admin)
export const updateDriver = async (req, res) => {
    const { id } = req.params; // This is driver_id
    console.log(`Update Driver ${id} Request Body:`, req.body); // Debug log

    const {
        firstName, lastName, phone, nic, address,
        licenseNumber, licenseType, licenseExpiry, experience
    } = req.body;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Get user_id from driver_id
        const [driverRows] = await connection.query('SELECT user_id FROM drivers WHERE driver_id = ?', [id]);
        if (driverRows.length === 0) {
            throw new Error('Driver not found');
        }
        const userId = driverRows[0].user_id;

        // 1. Update User Details
        let userUpdates = [];
        let userParams = [];
        if (firstName) { userUpdates.push('first_name = ?'); userParams.push(firstName); }
        if (lastName) { userUpdates.push('last_name = ?'); userParams.push(lastName); }
        if (phone) { userUpdates.push('phone_number = ?'); userParams.push(phone); }

        if (userUpdates.length > 0) {
            await connection.query(
                `UPDATE users SET ${userUpdates.join(', ')} WHERE user_id = ?`,
                [...userParams, userId]
            );
        }

        // 2. Update Driver Details
        let driverUpdates = [];
        let driverParams = [];
        if (nic) { driverUpdates.push('nic = ?'); driverParams.push(nic); }
        if (address) { driverUpdates.push('address = ?'); driverParams.push(address); }
        if (licenseNumber) { driverUpdates.push('license_number = ?'); driverParams.push(licenseNumber); }
        if (licenseType) { driverUpdates.push('license_type = ?'); driverParams.push(licenseType); }
        if (licenseExpiry) { driverUpdates.push('license_expiry_date = ?'); driverParams.push(licenseExpiry); }
        // REMOVED experience update

        if (driverUpdates.length > 0) {
            await connection.query(
                `UPDATE drivers SET ${driverUpdates.join(', ')} WHERE driver_id = ?`,
                [...driverParams, id]
            );
        }

        await connection.commit();
        res.json({ message: 'Driver updated successfully' });

    } catch (error) {
        await connection.rollback();
        console.error('Update Driver Error:', error);
        res.status(500).json({ message: 'Failed to update driver', error: error.message });
    } finally {
        connection.release();
    }
};
