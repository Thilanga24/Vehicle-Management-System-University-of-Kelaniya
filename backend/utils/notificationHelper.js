import db from '../config/db.js';

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
