const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        createTestAccounts();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Add this after mongoose.connect
mongoose.connection.on('error', err => {
    console.error('MongoDB error:', err);
});

mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully');
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Song Schema
const songSchema = new mongoose.Schema({
    title: String,
    url: String,
    coverUrl: String,
    duration: Number,
    uploadDate: { type: Date, default: Date.now }
});

const Song = mongoose.model('Song', songSchema);

// Add this near your other schemas
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all songs
app.get('/api/songs', async (req, res) => {
    try {
        const songs = await Song.find().sort('-uploadDate');
        res.json(songs);
    } catch (error) {
        console.error('Error fetching songs:', error);
        res.status(500).json({ error: 'Failed to fetch songs' });
    }
});

// Add this route for checking songs
app.get('/api/check-songs', async (req, res) => {
    try {
        const songs = await Song.find();
        res.json({
            total: songs.length,
            songs: songs.map(song => ({
                id: song._id,
                title: song.title,
                url: song.url,
                coverUrl: song.coverUrl,
                uploadDate: song.uploadDate
            }))
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch songs' });
    }
});

// Add favicon route
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Get single song
app.get('/api/songs/:id', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song) {
            return res.status(404).json({ error: 'Song not found' });
        }
        res.json(song);
    } catch (error) {
        console.error('Error fetching song:', error);
        res.status(500).json({ error: 'Failed to fetch song' });
    }
});

// Upload song
app.post('/api/songs', async (req, res) => {
    try {
        const song = new Song(req.body);
        await song.save();
        console.log('Song saved:', song);
        res.status(201).json(song);
    } catch (error) {
        console.error('Error saving song:', error);
        res.status(500).json({ error: 'Failed to save song' });
    }
});

// Serve music-player.html
app.get('/music-player', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'music-player.html'));
});

// Debug route
app.get('/api/debug/songs', async (req, res) => {
    try {
        const songs = await Song.find();
        console.log('Found songs:', songs); // This will show in server console
        
        if (songs.length === 0) {
            return res.json({
                message: 'No songs found in database',
                count: 0,
                songs: []
            });
        }
        
        res.json({
            message: 'Songs found',
            count: songs.length,
            songs: songs
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete song
app.delete('/api/songs/:id', async (req, res) => {
    try {
        const songId = req.params.id;
        console.log('Attempting to delete song with ID:', songId);

        // Find the song first
        const song = await Song.findById(songId);
        
        if (!song) {
            console.log('Song not found with ID:', songId);
            return res.status(404).json({ error: 'Song not found' });
        }

        // Delete from MongoDB
        const result = await Song.findByIdAndDelete(songId);
        console.log('Delete result:', result);

        if (result) {
            console.log('Song deleted successfully:', songId);
            res.json({ message: 'Song deleted successfully' });
        } else {
            console.log('Song not found for deletion');
            res.status(404).json({ error: 'Song not found' });
        }

    } catch (error) {
        console.error('Error deleting song:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid song ID format' });
        }
        res.status(500).json({ error: 'Failed to delete song' });
    }
});

// Add route to update cover image
app.patch('/api/songs/:id/cover', async (req, res) => {
    try {
        const { id } = req.params;
        const { coverUrl } = req.body;

        if (!coverUrl) {
            return res.status(400).json({ error: 'Cover URL is required' });
        }

        const updatedSong = await Song.findByIdAndUpdate(
            id,
            { coverUrl: coverUrl },
            { new: true }
        );

        if (!updatedSong) {
            return res.status(404).json({ error: 'Song not found' });
        }

        res.json(updatedSong);
    } catch (error) {
        console.error('Error updating cover:', error);
        res.status(500).json({ error: 'Failed to update cover' });
    }
});

// Add authentication routes
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password, // In production, hash this password!
            role: role || 'user'
        });

        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Add this debug route to check users
app.get('/api/debug/users', async (req, res) => {
    try {
        const users = await User.find();
        console.log('All users:', users);
        res.json({
            count: users.length,
            users: users.map(user => ({
                username: user.username,
                email: user.email,
                role: user.role
            }))
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Update your login route with better logging
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt:', { email, password }); // Debug log
        
        // Find user
        const user = await User.findOne({ email });
        console.log('Found user:', user); // Debug log
        
        if (!user) {
            console.log('No user found with email:', email);
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.password !== password) {
            console.log('Password mismatch for user:', email);
            return res.status(401).json({ error: 'Invalid password' });
        }

        console.log('Login successful for:', email);
        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Handle 404s
app.use((req, res) => {
    console.log('404 for:', req.url);
    res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Add this after your MongoDB connection to create test accounts
async function createTestAccounts() {
    try {
        // Check if admin exists
        const adminExists = await User.findOne({ email: 'admin@yash.com' });
        if (!adminExists) {
            await User.create({
                username: 'admin',
                email: 'admin@yash.com',
                password: 'admin123',
                role: 'admin'
            });
            console.log('Admin account created');
        }

        // Check if test user exists
        const userExists = await User.findOne({ email: 'user@yash.com' });
        if (!userExists) {
            await User.create({
                username: 'user',
                email: 'user@yash.com',
                password: 'user123',
                role: 'user'
            });
            console.log('Test user account created');
        }
    } catch (error) {
        console.error('Error creating test accounts:', error);
    }
} 