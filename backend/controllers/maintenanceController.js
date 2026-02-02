import db from '../config/db.js';

// @desc    Get all maintenance records
// @route   GET /api/maintenance
// @access  Private
export const getMaintenanceRecords = async (req, res) => {
    try {
        const [records] = await db.query(`
            SELECT m.*, v.registration_number, v.make, v.model 
            FROM maintenance_records m
            JOIN vehicles v ON m.vehicle_id = v.vehicle_id
            ORDER BY m.service_date DESC
        `);
        res.json(records);
    } catch (error) {
        console.error('Error fetching maintenance records:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add maintenance record
// @route   POST /api/maintenance
// @access  Private
export const addMaintenanceRecord = async (req, res) => {
    const {
        vehicleId, serviceType, issueDescription, cost,
        serviceDate, completionDate, status, priority,
        garageName, reportedByUserId
    } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO maintenance_records (
                vehicle_id, service_type, issue_description, cost, 
                service_date, completion_date, status, priority, 
                garage_name, reported_by_user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                vehicleId,
                serviceType,
                issueDescription,
                cost || 0,
                serviceDate,
                completionDate || null,
                status || 'scheduled',
                priority || 'low',
                garageName,
                reportedByUserId || null
            ]
        );

        // Update vehicle status if it's currently in maintenance
        if (status === 'in_progress') {
            await db.query('UPDATE vehicles SET status = "maintenance" WHERE vehicle_id = ?', [vehicleId]);
        }

        res.status(201).json({ message: 'Maintenance record added', id: result.insertId });
    } catch (error) {
        console.error('Add Maintenance Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update maintenance record
// @route   PUT /api/maintenance/:id
// @access  Private
export const updateMaintenanceRecord = async (req, res) => {
    const { id } = req.params;
    const {
        status, completionDate, cost, issueDescription, mileage, garageName
    } = req.body;

    try {
        const [record] = await db.query('SELECT vehicle_id FROM maintenance_records WHERE record_id = ?', [id]);
        if (record.length === 0) return res.status(404).json({ message: 'Record not found' });

        const vehicleId = record[0].vehicle_id;

        await db.query(
            'UPDATE maintenance_records SET status = ?, completion_date = ?, cost = ?, issue_description = ?, garage_name = ? WHERE record_id = ?',
            [status, completionDate, cost, issueDescription, garageName, id]
        );

        // If completed, set vehicle back to available
        if (status === 'completed') {
            // Note: mileage column is NOT in the user's provided SQL for maintenance_records, 
            // but I should update vehicles table mileage if provided.
            await db.query('UPDATE vehicles SET status = "available"' + (mileage ? ', current_mileage = ?' : '') + ' WHERE vehicle_id = ?',
                mileage ? [mileage, vehicleId] : [vehicleId]
            );
        }

        res.json({ message: 'Maintenance record updated' });
    } catch (error) {
        console.error('Update Maintenance Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get maintenance analytics/stats
// @route   GET /api/maintenance/stats
// @access  Private
export const getMaintenanceStats = async (req, res) => {
    try {
        const [criticalCount] = await db.query('SELECT COUNT(*) as count FROM maintenance_records WHERE priority = "critical" AND status != "completed"');
        const [scheduledCount] = await db.query('SELECT COUNT(*) as count FROM maintenance_records WHERE status = "scheduled"');
        const [activeCount] = await db.query('SELECT COUNT(*) as count FROM maintenance_records WHERE status = "in_progress"');
        const [totalCost] = await db.query('SELECT SUM(cost) as total FROM maintenance_records WHERE MONTH(service_date) = MONTH(CURRENT_DATE)');

        res.json({
            criticalIssues: criticalCount[0].count,
            scheduledServices: scheduledCount[0].count,
            activeJobs: activeCount[0].count,
            monthlyCost: totalCost[0].total || 0
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
