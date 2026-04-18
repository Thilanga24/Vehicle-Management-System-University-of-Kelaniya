import db from '../config/db.js';
import { createNotification } from '../utils/notificationHelper.js';

// @desc    Create a reservation
// @route   POST /api/reservations
// @access  Private
export const createReservation = async (req, res) => {
    const {
        requesterId,
        destination,
        distance,
        passengers,
        emergency_contact,
        date,
        time,
        returnDate,
        returnTime,
        purpose,
        vehicleId,
        reservationType, // 'emergency' or 'normal'
        start_place,
        destinations, // array of strings
        remarks,
        natureOfEmergency
    } = req.body;

    // Handle file attachment
    const attachmentPath = req.file ? `/uploads/${req.file.filename}` : null;

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

    // Join destinations if an array is provided
    let finalDestination = destination || 'Unspecified';
    if (destinations && Array.isArray(destinations) && destinations.length > 0) {
        finalDestination = destinations.join(' -> ');
    }

    try {
        await db.query(
            `INSERT INTO reservations (requester_id, vehicle_id, start_place, destination, distance_km, passengers_count, emergency_contact, start_datetime, end_datetime, description, attachment_url, remarks, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                requesterId,
                vehicleId || null,
                start_place || null,
                finalDestination,
                parseFloat(distance) || 0,
                parseInt(passengers) || 1,
                emergency_contact || null,
                startDatetime,
                endDatetime,
                finalDescription,
                attachmentPath,
                remarks || null
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
            SELECT r.*, u.first_name, u.last_name, u.department, u.faculty, v.registration_number, v.model,
                   d.first_name as driver_first_name, d.last_name as driver_last_name, d.phone_number as driver_phone, d.license_number
            FROM reservations r
            JOIN users u ON r.requester_id = u.user_id
            LEFT JOIN vehicles v ON r.vehicle_id = v.vehicle_id
            LEFT JOIN drivers d ON v.assigned_driver_id = d.driver_id
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
// @desc    Update reservation status with approval workflow
// @route   PUT /api/reservations/:id
// @access  Private (Admin/HOD/Dean/SAR/Registrar)
export const updateReservationStatus = async (req, res) => {
    const { id } = req.params;
    const { status, level } = req.body;
    // level: 'hod', 'dean', 'sar', 'registrar', or null (admin/completion)

    if (level === 'management_assistant') {
        return res.status(403).json({ message: "Management Assistants are not authorized to approve reservations." });
    }

    if (!id) return res.status(400).json({ message: "Reservation ID required" });

    try {
        // 1. Get current reservation details
        const [rows] = await db.query('SELECT * FROM reservations WHERE reservation_id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Reservation not found" });

        const reservation = rows[0];
        let newStatus = reservation.status;
        let updateQuery = "";
        let queryParams = [];

        // 2. Determine updates based on level/role
        if (status === 'rejected') {
            newStatus = 'rejected';
            // Also update the specific level's status to rejected
            if (level === 'hod') updateQuery = "UPDATE reservations SET hod_approval_status = ?, status = ? WHERE reservation_id = ?";
            else if (level === 'dean') updateQuery = "UPDATE reservations SET dean_approval_status = ?, status = ? WHERE reservation_id = ?";
            else if (level === 'sar') updateQuery = "UPDATE reservations SET sar_approval_status = ?, status = ? WHERE reservation_id = ?";
            else if (level === 'registrar') updateQuery = "UPDATE reservations SET registrar_approval_status = ?, status = ? WHERE reservation_id = ?";
            else updateQuery = "UPDATE reservations SET status = ? WHERE reservation_id = ?"; // Fallback

            if (level && ['hod', 'dean', 'sar', 'registrar'].includes(level)) {
                queryParams = ['rejected', 'rejected', id];
            } else {
                queryParams = ['rejected', id];
            }

        } else if (status === 'approved') {
            if (level === 'hod') {
                updateQuery = "UPDATE reservations SET hod_approval_status = 'approved', status = 'pending_dean' WHERE reservation_id = ?";
                queryParams = [id];
            } else if (level === 'dean') {
                updateQuery = "UPDATE reservations SET dean_approval_status = 'approved', status = 'pending_sar' WHERE reservation_id = ?";
                queryParams = [id];
            } else if (level === 'sar') {
                // Check distance
                const distance = reservation.distance_km || 0;
                if (distance > 100) {
                    updateQuery = "UPDATE reservations SET sar_approval_status = 'approved', status = 'pending_registrar' WHERE reservation_id = ?";
                } else {
                    updateQuery = "UPDATE reservations SET sar_approval_status = 'approved', status = 'approved' WHERE reservation_id = ?";
                }
                queryParams = [id];
            } else if (level === 'registrar') {
                updateQuery = "UPDATE reservations SET registrar_approval_status = 'approved', status = 'approved' WHERE reservation_id = ?";
                queryParams = [id];
            } else {
                // Generic update (e.g. admin override or completing)
                updateQuery = "UPDATE reservations SET status = ? WHERE reservation_id = ?";
                queryParams = [status, id];
            }
        } else {
            // Other statuses (e.g. 'completed', 'cancelled')
            updateQuery = "UPDATE reservations SET status = ? WHERE reservation_id = ?";
            queryParams = [status, id];
        }

        // 3. Execute Update
        if (updateQuery) {
            await db.query(updateQuery, queryParams);

            // 4. Send Notification to Requester
            const requesterId = reservation.requester_id;
            let notificationTitle = "Reservation Update";
            let notificationMessage = `Your reservation request to ${reservation.destination} has been updated.`;
            let notificationType = "info";

            if (status === 'rejected') {
                notificationTitle = "Reservation Rejected";
                notificationMessage = `Your reservation request to ${reservation.destination} has been rejected by ${level ? level.toUpperCase() : 'Administrator'}.`;
                notificationType = "error";
            } else if (status === 'approved' || updateQuery.includes('status = \'approved\'')) {
                const finalApproved = updateQuery.includes("status = 'approved'");
                notificationTitle = finalApproved ? "Reservation Approved" : "Reservation Level Approved";
                notificationMessage = finalApproved 
                    ? `Your reservation request to ${reservation.destination} has been fully approved!` 
                    : `Your reservation request to ${reservation.destination} has been approved by ${level.toUpperCase()} and is moving to the next level.`;
                notificationType = "success";
            } else if (status === 'cancelled') {
                notificationTitle = "Reservation Cancelled";
                notificationMessage = `You have successfully cancelled your reservation request to ${reservation.destination}.`;
                notificationType = "info";
            }

            await createNotification(requesterId, notificationTitle, notificationMessage, notificationType);

            res.json({ message: `Reservation status updated successfully`, status: newStatus });
        } else {
            res.status(400).json({ message: "Invalid update parameters" });
        }

    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
