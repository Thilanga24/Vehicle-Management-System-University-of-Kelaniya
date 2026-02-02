import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function discoverSchema() {
    try {
        console.log('Connecting to DB at ' + process.env.DB_HOST + '...');
        const [tables] = await db.query('SHOW TABLES');
        const dbName = process.env.DB_NAME;
        const tableNames = tables.map(t => t[`Tables_in_${dbName}`]);

        console.log('\n--- TABLES FOUND ---');
        console.log(tableNames.join(', '));

        for (const tableName of tableNames) {
            const [columns] = await db.query(`SHOW COLUMNS FROM ${tableName}`);
            console.log(`\n--- ${tableName.toUpperCase()} TABLE COLUMNS ---`);
            columns.forEach(c => console.log(`- ${c.Field} (${c.Type})`));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error discovering schema:', error);
        process.exit(1);
    }
}

discoverSchema();
