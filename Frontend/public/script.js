const API_URL = 'https://yash-music-fiwm.onrender.com'; // Your Render backend URL

let currentSong = null;
let isPlaying = false;
let songs = [];
const audio = new Audio();
const defaultCover = '/default-cover.jpg';

// Check authentication
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded, checking auth...');
    if (!checkAuth()) return;
    
    console.log('User authenticated, fetching songs...');
    await fetchSongs();
    
    // Setup logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.onclick = handleLogout;
    }
});

// Save song state
function saveSongState() {
    if (currentSong) {
        localStorage.setItem('currentSong', JSON.stringify(currentSong));
        localStorage.setItem('currentTime', audio.currentTime);
        localStorage.setItem('isPlaying', isPlaying);
    }
}

// Load song state
function loadSongState() {
    try {
        const savedSong = localStorage.getItem('currentSong');
        const savedTime = localStorage.getItem('currentTime');
        const savedIsPlaying = localStorage.getItem('isPlaying') === 'true';

        if (savedSong) {
            currentSong = JSON.parse(savedSong);
            audio.src = currentSong.url;
            audio.currentTime = parseFloat(savedTime) || 0;
            isPlaying = savedIsPlaying;

            if (isPlaying) {
                audio.play().catch(console.error);
            }

            updateMiniPlayer(currentSong);
        }
    } catch (error) {
        console.error('Error loading song state:', error);
    }
}

// Fetch songs from server
async function fetchSongs() {
    try {
        const response = await fetch(`${API_URL}/api/songs`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch songs');
        }
        
        const songsData = await response.json();
        console.log('Songs loaded:', songsData);
        
        // Update the global songs array
        songs = songsData;
        
        // Display the songs
        displaySongs();
    } catch (error) {
        console.error('Error fetching songs:', error);
        document.getElementById('songs-container').innerHTML = 
            '<div class="error-message">Failed to load songs. Please try again later.</div>';
    }
}

// Display songs
function displaySongs() {
    const container = document.getElementById('songs-container');
    if (!container) return;

    if (!songs || songs.length === 0) {
        container.innerHTML = '<div class="no-songs">No songs available</div>';
        return;
    }

    container.innerHTML = songs.map(song => `
        <div class="song-card">
            <img src="${song.coverUrl || '/default-cover.jpg'}" 
                 alt="${song.title}" 
                 onerror="this.src='/default-cover.jpg'">
            <div class="song-info">
                <h3>${song.title}</h3>
                <button onclick="playSong('${song._id}', '${song.url}', '${song.title}', '${song.coverUrl}')">
                    <i class="fas fa-play"></i> Play
                </button>
            </div>
        </div>
    `).join('');
}

// Update mini player
function updateMiniPlayer(song) {
    if (!song) return;
    
    const miniPlayer = document.getElementById('mini-player');
    const miniTitle = document.getElementById('mini-title');
    const miniPlayBtn = document.getElementById('mini-play-btn');
    const miniCover = document.getElementById('mini-cover');
    
    if (miniPlayer && miniTitle && miniPlayBtn && miniCover) {
        miniPlayer.style.display = 'flex';
        miniCover.src = song.coverUrl || defaultCover;
        miniTitle.textContent = song.title;
        miniPlayBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }
}

// Play song
function playSong(id, url, title, coverUrl) {
    console.log('Playing song:', { id, url, title, coverUrl });
    
    try {
        // Update current song
        currentSong = { id, url, title, coverUrl };
        
        // Update audio source and play
        audio.src = url;
        audio.play()
            .then(() => {
                isPlaying = true;
                updateMiniPlayer();
            })
            .catch(error => {
                console.error('Error playing song:', error);
                alert('Error playing song. Please try again.');
            });
            
        // Update mini player
        updateMiniPlayer();
    } catch (error) {
        console.error('Error in playSong:', error);
    }
}

// Handle card click
function handleCardClick(event, index) {
    if (event.target.closest('.song-buttons')) return;
    playSong(songs[index]._id, songs[index].url, songs[index].title, songs[index].coverUrl);
}

// Toggle play/pause
function togglePlay() {
    if (!currentSong) return;
    
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
    } else {
        audio.play();
        isPlaying = true;
    }
    updateMiniPlayer();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchSongs().then(() => {
        loadSongState();
    });
});

audio.addEventListener('ended', () => {
    isPlaying = false;
    updateMiniPlayer();
});

audio.addEventListener('timeupdate', saveSongState);

// Setup admin controls
function setupAdminControls() {
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const songId = button.dataset.id;
            if (confirm('Are you sure you want to delete this song?')) {
                deleteSong(songId);
            }
        });
    });

    document.querySelectorAll('.edit-cover-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const songId = button.dataset.id;
            changeCoverImage(songId);
        });
    });
}

// Delete song
async function deleteSong(songId) {
    try {
        const response = await fetch(`${API_URL}/api/songs/${songId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            songs = songs.filter(song => song._id !== songId);
            displaySongs();
            alert('Song deleted successfully');
        } else {
            throw new Error('Failed to delete song');
        }
    } catch (error) {
        console.error('Error deleting song:', error);
        alert('Failed to delete song');
    }
}

// Change cover image
async function changeCoverImage(songId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'yash_music');
            
            const response = await fetch('https://api.cloudinary.com/v1_1/your-cloud-name/image/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            const updateResponse = await fetch(`${API_URL}/api/songs/${songId}/cover`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ coverUrl: data.secure_url })
            });

            if (updateResponse.ok) {
                const songIndex = songs.findIndex(song => song._id === songId);
                if (songIndex !== -1) {
                    songs[songIndex].coverUrl = data.secure_url;
                    displaySongs();
                }
                alert('Cover image updated successfully');
            }
        } catch (error) {
            console.error('Error updating cover:', error);
            alert('Failed to update cover image');
        }
    };

    input.click();
}

// Window beforeunload event
window.addEventListener('beforeunload', saveSongState);

// Add these functions at the top of your script.js
function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            console.log('Logout button clicked');
            if (confirm('Are you sure you want to logout?')) {
                console.log('Logout confirmed');
                localStorage.clear();
                console.log('LocalStorage cleared');
                window.location.href = '/login.html';
            }
        });
    } else {
        console.error('Logout button not found');
    }
}

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        console.log('No user found, redirecting to login...');
        window.location.href = '/login.html';
        return null;
    }
    console.log('User authenticated:', user);
    return user;
}

// Add these functions for upload functionality
function setupAdminFeatures() {
    const user = JSON.parse(localStorage.getItem('user'));
    const adminControls = document.getElementById('admin-controls');
    
    if (user && user.role === 'admin') {
        adminControls.style.display = 'block';
        setupUploadModal();
    }
}

function setupUploadModal() {
    const modal = document.getElementById('uploadModal');
    const btn = document.getElementById('uploadSongBtn');
    const span = document.getElementsByClassName('close')[0];
    const form = document.getElementById('uploadForm');
    const songFile = document.getElementById('songFile');
    const coverFile = document.getElementById('coverImage');
    
    // Show file details when selected
    songFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const details = document.getElementById('songFileDetails');
        if (file) {
            const size = (file.size / (1024 * 1024)).toFixed(2); // Convert to MB
            details.textContent = `Selected: ${file.name} (${size} MB)`;
        } else {
            details.textContent = '';
        }
    });

    coverFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const details = document.getElementById('coverFileDetails');
        if (file) {
            const size = (file.size / (1024 * 1024)).toFixed(2); // Convert to MB
            details.textContent = `Selected: ${file.name} (${size} MB)`;
            
            // Preview image
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.createElement('img');
                preview.src = e.target.result;
                preview.style.maxWidth = '100px';
                preview.style.marginTop = '5px';
                preview.style.borderRadius = '4px';
                details.appendChild(preview);
            };
            reader.readAsDataURL(file);
        } else {
            details.textContent = '';
        }
    });
    
    btn.onclick = () => {
        modal.style.display = 'block';
        // Clear previous details
        document.getElementById('songFileDetails').textContent = '';
        document.getElementById('coverFileDetails').textContent = '';
    };
    
    span.onclick = () => modal.style.display = 'none';
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    form.onsubmit = handleUpload;
}

async function handleUpload(e) {
    e.preventDefault();
    
    const title = document.getElementById('songTitle').value;
    const songFile = document.getElementById('songFile').files[0];
    const coverFile = document.getElementById('coverImage').files[0];
    const progressBar = document.getElementById('uploadProgress');
    const progressDiv = progressBar.querySelector('.progress');
    
    try {
        progressBar.style.display = 'block';
        progressDiv.style.width = '10%';

        // Upload cover image to Cloudinary
        const coverFormData = new FormData();
        coverFormData.append('file', coverFile);
        coverFormData.append('upload_preset', 'yash_music');
        coverFormData.append('cloud_name', 'dvtrsojsa');

        const coverResponse = await fetch(
            'https://api.cloudinary.com/v1_1/dvtrsojsa/image/upload',
            {
                method: 'POST',
                body: coverFormData
            }
        );
        const coverData = await coverResponse.json();
        progressDiv.style.width = '40%';

        // Upload song file to Cloudinary
        const songFormData = new FormData();
        songFormData.append('file', songFile);
        songFormData.append('upload_preset', 'yash_music');
        songFormData.append('cloud_name', 'dvtrsojsa');

        const songResponse = await fetch(
            'https://api.cloudinary.com/v1_1/dvtrsojsa/video/upload',
            {
                method: 'POST',
                body: songFormData
            }
        );
        const songData = await songResponse.json();
        progressDiv.style.width = '70%';

        // Save song details to your backend
        const response = await fetch(`${API_URL}/api/songs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'https://yashmusic2122s.netlify.app'
            },
            body: JSON.stringify({
                title: title,
                url: songData.secure_url,
                coverUrl: coverData.secure_url
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save song details');
        }

        progressDiv.style.width = '100%';
        alert('Song uploaded successfully!');
        
        // Reset form and refresh songs
        document.getElementById('uploadForm').reset();
        document.getElementById('uploadModal').style.display = 'none';
        await fetchSongs();
        
    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload song: ' + error.message);
    } finally {
        progressBar.style.display = 'none';
        progressDiv.style.width = '0%';
    }
}

// Add these styles to your CSS
const styles = `
.no-songs {
    text-align: center;
    color: #666;
    padding: 20px;
}

.error-message {
    color: #ff4444;
    text-align: center;
    padding: 20px;
}
`;

// Add the styles to the page
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Add this function to handle logout
function handleLogout() {
    localStorage.clear();
    window.location.href = '/login.html';
}

// Update navigation functions
function redirectToLogin() {
    window.location.href = '/login.html';
}

function redirectToHome() {
    window.location.href = '/';
} 
