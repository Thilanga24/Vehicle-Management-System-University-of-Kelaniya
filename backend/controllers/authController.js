import db from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    const { employeeId, firstName, lastName, email, password, role, department, faculty, phone, nic, licenseNumber, licenseType, licenseExpiryDate } = req.body;

    try {
        // Check if user exists
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ? OR employee_id = ?', [email, employeeId]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert User
        const [result] = await db.query(
            'INSERT INTO users (employee_id, first_name, last_name, email, password_hash, role, department, faculty, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [employeeId, firstName, lastName, email, passwordHash, role, department || null, faculty || null, phone]
        );

        const userId = result.insertId;



        res.status(201).json({ message: 'User registered successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check user
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create Token
        const token = jwt.sign(
            { id: user.user_id, role: user.role, name: `${user.first_name} ${user.last_name}` },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.user_id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                role: user.role,
                department: user.department,
                faculty: user.faculty
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all users (excluding drivers)
// @route   GET /api/auth/users
// @access  Private (Admin)
export const getUsers = async (req, res) => {
    try {
        const [users] = await db.query("SELECT user_id, first_name, last_name, email, role, department, faculty, phone_number, created_at FROM users WHERE role != 'driver' ORDER BY created_at DESC");
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
