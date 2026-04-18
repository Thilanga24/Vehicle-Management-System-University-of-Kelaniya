import db from '../config/db.js';

export const getNotifications = async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [userId]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
};

export const markAsRead = async (req, res) => {
    const { notificationId } = req.params;
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE notification_id = ?',
            [notificationId]
        );
        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Error marking notification as read' });
    }
};

export const createNotification = async (userId, title, message, type = 'info') => {
    try {
        await db.query(
            'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
            [userId, title, message, type]
        );
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};
