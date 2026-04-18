import db from '../config/db.js';

async function checkUsers() {
    try {
        const [users] = await db.query('SELECT user_id, email, role FROM users');
        console.log('--- Users in Database ---');
        users.forEach(u => {
            console.log(`ID: ${u.user_id} | Email: ${u.email} | Role: ${u.role}`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error checking users:', error);
        process.exit(1);
    }
}

checkUsers();
