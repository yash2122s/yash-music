const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['https://yashmusic2122s.netlify.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Add OPTIONS handling for preflight requests
app.options('*', cors());

// Parse JSON bodies
app.use(express.json());
app.use(express.static('public'));

// Log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
});

// Initialize Firebase Admin with environment variables
const firebaseConfig = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CERT_URL
};

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig)
});

// Routes
const songsRouter = require('./routes/songs');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

app.use('/api/songs', songsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle MongoDB disconnection
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected! Attempting to reconnect...');
    connectDB();
}); 