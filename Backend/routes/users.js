const express = require('express');
const router = express.Router();
const User = require('../models/User');
const admin = require('firebase-admin');

// Create new user
router.post('/', async (req, res) => {
    try {
        const { email, uid, role } = req.body;
        
        const user = new User({
            email,
            uid,
            role: role || 'user'
        });
        
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const decodedToken = await admin.auth().verifyIdToken(token);
        const user = await User.findOne({ uid: decodedToken.uid });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 