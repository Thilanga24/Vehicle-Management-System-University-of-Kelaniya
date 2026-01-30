import db from './config/db.js';

async function checkUsers() {
    console.log("Connecting to DB...");
    try {
        const [rows] = await db.query('SELECT user_id, first_name, last_name, email FROM users ORDER BY user_id DESC LIMIT 5');
        console.log("Query success:");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Query failed:", error);
        process.exit(1);
    }
}

checkUsers();
