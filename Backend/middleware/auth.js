const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Admin credentials
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

// Test route to verify the auth endpoint is working
router.get('/test', (req, res) => {
    res.json({ message: 'Auth route is working' });
});

router.post('/login', (req, res) => {
    try {
        console.log('Received login request:', req.body);

        if (!req.body.email || !req.body.password) {
            console.log('Missing email or password');
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const { email, password } = req.body;

        // Log the comparison
        console.log('Comparing:', {
            receivedEmail: email,
            receivedPassword: password,
            expectedEmail: ADMIN_EMAIL,
            expectedPassword: ADMIN_PASSWORD,
            emailMatch: email === ADMIN_EMAIL,
            passwordMatch: password === ADMIN_PASSWORD
        });

        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            console.log('Credentials matched, generating token');
            
            const token = jwt.sign(
                { email: ADMIN_EMAIL, role: 'admin' },
                'your-secret-key', // Using a hardcoded secret for testing
                { expiresIn: '24h' }
            );

            console.log('Token generated successfully');

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    email: ADMIN_EMAIL,
                    role: 'admin'
                }
            });
        }

        console.log('Invalid credentials provided');
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
});

module.exports = router; 