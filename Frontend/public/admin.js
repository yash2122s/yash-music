// Cloudinary configuration
const cloudName = 'dvtrsojsa';
const uploadPreset = 'songs_preset';

// Initialize variables
let files = [];
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const progressBar = document.getElementById('uploadProgress');
const fileList = document.getElementById('fileList');

// Setup drag and drop
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.background = '#e1e1e1';
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.style.background = 'transparent';
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.background = 'transparent';
    handleFiles(e.dataTransfer.files);
});

uploadZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(uploadedFiles) {
    files = [...uploadedFiles];
    updateFileList();
    uploadFiles();
}

function updateFileList() {
    fileList.innerHTML = files.map((file, index) => `
        <div class="upload-item">
            <div class="file-item">
                <span>${file.name}</span>
                <span class="status" style="color: blue;">Waiting...</span>
            </div>
            <div class="cover-upload">
                <label>Cover Image: 
                    <input type="file" 
                           class="cover-input" 
                           accept="image/*" 
                           data-song-index="${index}"
                           onchange="handleCoverChange(${index}, event)">
                </label>
            </div>
        </div>
    `).join('');
}

function handleCoverChange(songIndex, event) {
    const coverFile = event.target.files[0];
    if (coverFile) {
        console.log(`Cover selected for song ${songIndex}:`, coverFile.name);
    }
}

async function uploadFiles() {
    const totalFiles = files.length;
    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
        const songFile = files[i];
        const coverInput = document.querySelector(`input[data-song-index="${i}"]`);
        const coverFile = coverInput ? coverInput.files[0] : null;

        try {
            console.log('Uploading song:', songFile.name);
            updateFileStatus(i, 'Uploading song...');
            
            // Upload song
            const songFormData = new FormData();
            songFormData.append('file', songFile);
            songFormData.append('upload_preset', uploadPreset);
            songFormData.append('resource_type', 'video');

            const songResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
                method: 'POST',
                body: songFormData
            });

            const songData = await songResponse.json();
            
            // Update the default cover URL
            let coverUrl = 'https://res.cloudinary.com/dvtrsojsa/image/upload/c_thumb,w_200,g_face/v1737563910/default_cover_image_r14yut.jpg';

            if (coverFile) {
                updateFileStatus(i, 'Uploading cover...');
                const coverFormData = new FormData();
                coverFormData.append('file', coverFile);
                coverFormData.append('upload_preset', uploadPreset);
                coverFormData.append('resource_type', 'image');

                const coverResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: 'POST',
                    body: coverFormData
                });

                const coverData = await coverResponse.json();
                coverUrl = coverData.secure_url;
            }

            // Save song data to database with cover URL
            await saveSongToDatabase({
                title: songFile.name.replace('.mp3', ''),
                url: songData.secure_url,
                coverUrl: coverUrl,
                duration: songData.duration || 0
            });

            uploadedCount++;
            if (progressBar) {
                progressBar.style.width = `${(uploadedCount / totalFiles) * 100}%`;
            }
            updateFileStatus(i, 'Uploaded ✓');

        } catch (error) {
            console.error('Upload error:', error);
            updateFileStatus(i, 'Failed ✗');
        }
    }
}

function updateFileStatus(index, status) {
    const statusSpan = document.querySelectorAll('.status')[index];
    if (statusSpan) {
        statusSpan.textContent = status;
        statusSpan.style.color = status.includes('✓') ? 'green' : 
                                status.includes('✗') ? 'red' : 'blue';
    }
}

async function saveSongToDatabase(songData) {
    try {
        const response = await fetch('/api/songs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(songData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Song saved:', result);
        return result;
    } catch (error) {
        console.error('Failed to save song:', error);
        throw error;
    }
} 