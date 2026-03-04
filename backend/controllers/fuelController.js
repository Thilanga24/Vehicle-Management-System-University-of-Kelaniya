import promisePool from '../config/db.js';

export const addFuelRecord = async (req, res) => {
    const { vehicle_id, date, liters, cost } = req.body;
    try {
        const [result] = await promisePool.query(
            'INSERT INTO fuel_logs (vehicle_id, date, liters, cost) VALUES (?, ?, ?, ?)',
            [vehicle_id, date, liters, cost]
        );
        res.status(201).json({ message: 'Fuel record added', id: result.insertId });
    } catch (error) {
        console.error('Error adding fuel record:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getFuelRecords = async (req, res) => {
    const { vehicle_id, startDate, endDate } = req.query;
    try {
        let query = `
            SELECT f.*, v.registration_number 
            FROM fuel_logs f 
            JOIN vehicles v ON f.vehicle_id = v.vehicle_id 
        `;
        const params = [];
        const conditions = [];

        if (vehicle_id && vehicle_id !== 'all') {
            conditions.push('f.vehicle_id = ?');
            params.push(vehicle_id);
        }

        if (startDate && endDate) {
            conditions.push('f.date BETWEEN ? AND ?');
            params.push(startDate, endDate);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY f.date DESC';

        const [rows] = await promisePool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching fuel records:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getFuelReport = async (req, res) => {
    const { vehicle_id, startDate, endDate } = req.query;
    try {
        let query = `
            SELECT SUM(cost) as total_cost, SUM(liters) as total_liters 
            FROM fuel_logs 
            WHERE date BETWEEN ? AND ?
        `;
        const params = [startDate, endDate];

        if (vehicle_id && vehicle_id !== 'all') {
            query += ' AND vehicle_id = ?';
            params.push(vehicle_id);
        }

        const [rows] = await promisePool.query(query, params);
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching fuel report:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
