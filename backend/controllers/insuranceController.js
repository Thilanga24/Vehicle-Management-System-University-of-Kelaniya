import db from '../config/db.js';

// @desc    Get all insurance records
// @route   GET /api/insurance
// @access  Private
export const getInsuranceRecords = async (req, res) => {
    try {
        const [records] = await db.query(`
            SELECT i.*, v.registration_number, v.make, v.model 
            FROM insurance_records i
            JOIN vehicles v ON i.vehicle_id = v.vehicle_id
            ORDER BY i.expiry_date ASC
        `);
        res.json(records);
    } catch (error) {
        console.error('Error fetching insurance records:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add insurance record
// @route   POST /api/insurance
// @access  Private
export const addInsuranceRecord = async (req, res) => {
    const { vehicle_id, provider_name, policy_number, start_date, expiry_date, premium_amount, status } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO insurance_records (
                vehicle_id, provider_name, policy_number, start_date, expiry_date, premium_amount, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [vehicle_id, provider_name, policy_number, start_date, expiry_date, premium_amount, status || 'active']
        );

        res.status(201).json({ message: 'Insurance record added', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'This vehicle already has an active policy.' });
        }
        console.error('Add Insurance Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update insurance status manually
// @route   PUT /api/insurance/:id
// @access  Private
export const updateInsuranceStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await db.query('UPDATE insurance_records SET status = ? WHERE policy_id = ?', [status, id]);
        res.json({ message: 'Insurance status updated' });
    } catch (error) {
        console.error('Update Insurance Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
