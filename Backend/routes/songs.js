const express = require('express');
const router = express.Router();
const Song = require('../models/Song');

// Get all songs
router.get('/', async (req, res) => {
    try {
        console.log('Fetching songs...');
        const songs = await Song.find().sort({ createdAt: -1 });
        console.log('Songs found:', songs.length);
        res.json(songs);
    } catch (error) {
        console.error('Error fetching songs:', error);
        res.status(500).json({ message: 'Error fetching songs', error: error.message });
    }
});

// Add new song
router.post('/', async (req, res) => {
    try {
        console.log('Adding new song:', req.body);
        const { title, url, coverUrl } = req.body;
        
        if (!title || !url || !coverUrl) {
            return res.status(400).json({ 
                message: 'Title, URL, and cover URL are required' 
            });
        }

        const song = new Song({
            title,
            url,
            coverUrl
        });

        const savedSong = await song.save();
        console.log('Song saved:', savedSong);
        res.status(201).json(savedSong);
    } catch (error) {
        console.error('Error saving song:', error);
        res.status(500).json({ message: 'Error saving song', error: error.message });
    }
});

// Delete song
router.delete('/:id', async (req, res) => {
    try {
        console.log('Deleting song:', req.params.id);
        await Song.findByIdAndDelete(req.params.id);
        res.json({ message: 'Song deleted successfully' });
    } catch (error) {
        console.error('Error deleting song:', error);
        res.status(500).json({ message: 'Error deleting song', error: error.message });
    }
});

module.exports = router; 