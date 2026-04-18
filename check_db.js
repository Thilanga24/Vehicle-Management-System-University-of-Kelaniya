import promisePool from './backend/config/db.js';

async function checkTables() {
    try {
        const [rows] = await promisePool.query('SHOW TABLES');
        console.log('Tables in database:', rows);
        
        for (const row of rows) {
            const tableName = Object.values(row)[0];
            const [columns] = await promisePool.query(`DESCRIBE ${tableName}`);
            console.log(`\nTable: ${tableName}`);
            console.table(columns);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkTables();
