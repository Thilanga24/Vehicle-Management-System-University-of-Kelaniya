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
