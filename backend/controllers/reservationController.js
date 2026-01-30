import db from '../config/db.js';

// @desc    Create a reservation
// @route   POST /api/reservations
// @access  Private
export const createReservation = async (req, res) => {
    const { requesterId, destination, distance, passengers, date, time, returnDate, returnTime, purpose, vehicleId } = req.body;

    // Combine date+time if needed, or store separate as in schema.
    // Schema had start_datetime and end_datetime
    const startDatetime = `${date} ${time}`;
    const endDatetime = `${returnDate} ${returnTime}`;

    try {
        await db.query(
            `INSERT INTO reservations (requester_id, vehicle_id, destination, distance_km, passengers_count, start_datetime, end_datetime, description, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [requesterId, vehicleId, destination, distance, passengers, startDatetime, endDatetime, purpose]
        );
        res.status(201).json({ message: 'Reservation created' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private
export const getReservations = async (req, res) => {
    try {
        const [reservations] = await db.query(`
            SELECT r.*, u.first_name, u.last_name, v.registration_number, v.model
            FROM reservations r
            JOIN users u ON r.requester_id = u.user_id
            LEFT JOIN vehicles v ON r.vehicle_id = v.vehicle_id
            ORDER BY r.created_at DESC
        `);
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update reservation status
// @route   PUT /api/reservations/:id
// @access  Private (Admin/HOD/Dean)
export const updateReservationStatus = async (req, res) => {
    const { id } = req.params;
    const { status, level } = req.body;
    // level = 'hod', 'dean', 'registrar' to update specific columns if complex logic used.
    // For simple demo, just update main status or specific column.

    try {
        let updateField = 'status';
        if (level === 'hod') updateField = 'hod_approval_status';
        else if (level === 'dean') updateField = 'dean_approval_status';
        else if (level === 'registrar') updateField = 'registrar_approval_status';

        await db.query(`UPDATE reservations SET ${updateField} = ? WHERE reservation_id = ?`, [status, id]);
        res.json({ message: `Reservation ${level ? level + ' ' : ''}status updated` });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
