import promisePool from './config/db.js';

async function setupInsurance() {
    try {
        console.log('Creating insurance_records table...');
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS insurance_records (
                insurance_id INT AUTO_INCREMENT PRIMARY KEY,
                vehicle_id INT NOT NULL,
                insurance_company VARCHAR(100) NOT NULL,
                policy_number VARCHAR(50) NOT NULL,
                expiry_date DATE NOT NULL,
                premium_amount DECIMAL(10, 2),
                status VARCHAR(20) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE
            )
        `);
        console.log('insurance_records table created or already exists.');
    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        process.exit();
    }
}

setupInsurance();
