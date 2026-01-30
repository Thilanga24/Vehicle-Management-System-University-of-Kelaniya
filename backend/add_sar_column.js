import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const addSarColumn = async () => {
    try {
        console.log('Adding sar_approval_status column to reservations table...');
        // We need to use db.query - which is promisePool.query
        // But note that db.js exports promisePool as default.
        // And promisePool does not have execute method? It should. Wait.
        // It's `pool.promise()`. So `db.query` is valid.
        // However, I need to check where to ADD COLUMN.
        // "AFTER dean_approval_status"

        await db.query(`
            ALTER TABLE reservations
            ADD COLUMN sar_approval_status VARCHAR(20) DEFAULT 'pending' AFTER dean_approval_status
        `);
        console.log('Column added successfully.');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column sar_approval_status already exists.');
        } else {
            console.error('Error adding column:', error);
        }
    } finally {
        process.exit();
    }
};

addSarColumn();
