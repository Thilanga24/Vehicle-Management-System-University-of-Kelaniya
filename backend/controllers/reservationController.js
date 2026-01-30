import db from '../config/db.js';

// @desc    Create a reservation
// @route   POST /api/reservations
// @access  Private
export const createReservation = async (req, res) => {
    const {
        requesterId,
        destination,
        distance,
        passengers,
        date,
        time,
        returnDate,
        returnTime,
        purpose,
        vehicleId,
        reservationType, // 'emergency' or 'normal'
        natureOfEmergency
    } = req.body;

    // Helper to format DateTime for MySQL
    const formatDateTime = (d, t) => {
        if (!d || !t) return new Date();
        const timePart = t.length === 5 ? `${t}:00` : t; // Ensure HH:MM:SS
        return `${d} ${timePart}`;
    };

    const startDatetime = (date && time) ? formatDateTime(date, time) : new Date();
    const endDatetime = (returnDate && returnTime) ? formatDateTime(returnDate, returnTime) : null;

    let finalDescription = purpose;
    if (reservationType === 'emergency') {
        finalDescription = `[EMERGENCY - ${natureOfEmergency}] ${purpose}`;
    }

    try {
        await db.query(
            `INSERT INTO reservations (requester_id, vehicle_id, destination, distance_km, passengers_count, start_datetime, end_datetime, description, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                requesterId,
                vehicleId || null,
                destination || 'Unspecified',
                parseFloat(distance) || 0,
                parseInt(passengers) || 1,
                startDatetime,
                endDatetime,
                finalDescription
            ]
        );
        res.status(201).json({ message: 'Reservation created' });
    } catch (error) {
        console.error('Create Reservation Error:', error);
        res.status(500).json({ message: 'Failed to create reservation', error: error.sqlMessage || error.message });
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
