import db from './config/db.js';

const check = async () => {
    try {
        await db.query('SELECT sar_approval_status FROM reservations LIMIT 1');
        console.log('Column exists.');
    } catch (error) {
        console.error('Column check failed:', error.message);
    } finally {
        process.exit();
    }
};
check();
