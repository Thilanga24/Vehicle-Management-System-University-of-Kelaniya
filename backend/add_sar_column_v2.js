import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load env from backend/.env explicitly
dotenv.config({ path: path.resolve('backend', '.env') });

const addSarColumn = async () => {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD, // It might be empty string
            database: process.env.DB_NAME
        });

        console.log('Connected. adding status columns...');

        // Add sar_approval_status
        try {
            await connection.query(`
                ALTER TABLE reservations
                ADD COLUMN sar_approval_status VARCHAR(20) DEFAULT 'pending' AFTER dean_approval_status
            `);
            console.log('sar_approval_status added.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('sar_approval_status already exists.');
            } else {
                console.error('Error adding column:', err.message);
            }
        }

    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
};

addSarColumn();
