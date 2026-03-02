-- Database Setup Script for Vehicle Management System
-- This script creates the database and all necessary tables with the latest schema.
-- 1. Create Database
CREATE DATABASE IF NOT EXISTS uok_vehicle_management;
USE uok_vehicle_management;
-- Disable foreign key checks to allow dropping tables in any order
SET FOREIGN_KEY_CHECKS = 0;
-- Drop existing tables if they exist
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS users;
-- 2. Create Users Table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM(
        'admin',
        'registrar',
        'sar',
        'dean',
        'hod',
        'staff',
        'driver',
        'management_assistant'
    ) NOT NULL,
    department VARCHAR(100),
    faculty VARCHAR(100),
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 3. Create Drivers Table (Standalone)
CREATE TABLE drivers (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    nic VARCHAR(20) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    address TEXT,
    license_number VARCHAR(50) NOT NULL,
    license_type VARCHAR(20) NOT NULL,
    -- e.g., 'Light', 'Heavy'
    license_expiry_date DATE NOT NULL,
    years_of_experience INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    -- 'active', 'inactive', 'on-leave'
    rating DECIMAL(2, 1) DEFAULT 5.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 4. Create Vehicles Table
CREATE TABLE vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50),
    -- 'Car', 'Van', 'Bus (Standard)', 'Bus (Rosa)', 'Cab', 'Lorry', 'Three-wheeler', 'Ambulance'
    make VARCHAR(50),
    model VARCHAR(50),
    year YEAR,
    seating_capacity INT,
    fuel_type VARCHAR(20),
    current_mileage INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'available',
    -- 'available', 'reserved', 'maintenance'
    assigned_driver_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_driver_id) REFERENCES drivers(driver_id) ON DELETE
    SET NULL
);
-- 5. Create Reservations Table
CREATE TABLE reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    vehicle_id INT,
    start_place VARCHAR(255),
    destination TEXT,
    distance_km FLOAT,
    passengers_count INT,
    start_datetime DATETIME,
    end_datetime DATETIME,
    description TEXT,
    attachment_url VARCHAR(255),
    remarks TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'approved', 'rejected', 'completed'
    hod_approval_status VARCHAR(20) DEFAULT 'pending',
    dean_approval_status VARCHAR(20) DEFAULT 'pending',
    registrar_approval_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE
    SET NULL
);
-- 6. Create Maintenance Records Table
CREATE TABLE IF NOT EXISTS maintenance_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    reported_by_user_id INT NULL,
    service_type ENUM(
        'Routine Service',
        'Repair',
        'Inspection',
        'Emergency'
    ) NOT NULL,
    issue_description TEXT,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    service_date DATE NOT NULL,
    completion_date DATE NULL,
    garage_name VARCHAR(100),
    cost DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM(
        'scheduled',
        'in_progress',
        'completed',
        'cancelled'
    ) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by_user_id) REFERENCES users(user_id)
);
-- 7. Insert Default Admin User (Optional)
-- Password is 'password123' (hashed)
INSERT INTO users (
        first_name,
        last_name,
        email,
        password_hash,
        role
    )
VALUES (
        'System',
        'Admin',
        'admin@uok.ac.lk',
        '$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789012345',
        'admin'
    );
-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;