import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function checkSchema() {
    try {
        console.log('Connecting to DB...');
        const [usersColumns] = await db.query('SHOW COLUMNS FROM users');
        console.log('\n--- USERS TABLE COLUMNS ---');
        usersColumns.forEach(c => console.log(`- ${c.Field} (${c.Type})`));

        const [driversColumns] = await db.query('SHOW COLUMNS FROM drivers');
        console.log('\n--- DRIVERS TABLE COLUMNS ---');
        driversColumns.forEach(c => console.log(`- ${c.Field} (${c.Type})`));

        process.exit(0);
    } catch (error) {
        console.error('Error connecting or querying:', error);
        process.exit(1);
    }
}

checkSchema();
