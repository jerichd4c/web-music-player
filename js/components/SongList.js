export class SongList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.currentSongs = []; 
    }

    connectedCallback() {
        this.render();
        this.init();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <link rel="stylesheet" href="./css/components/SongList.css">

        <div class="song-list-container">
            <div class="header">
                <h2>My Songs</h2>
                <div class="actions">

                    <button id="add-btn" title="Add local file">➕</button>
                    <button id="delete-mode-btn" title="Borrar canciones">🗑️</button>
                </div>
            </div>

            <div class="search-bar">
                <input type="text" id="search-input" placeholder="Search song... 🔎">
            </div>

            <div id="delete-all-container" style="display: none; text-align: right; margin-bottom: 10px;">
                <button id="delete-all-btn" style="color: red; cursor: pointer; background: none; border: 1px solid red; padding: 5px 10px; border-radius: 5px;">🗑️ Delete All</button>
            </div>

            <input type="file" id="file-input" accept="audio/mp3, audio/m4a, audio/flac, audio/wav, audio/ogg" multiple hidden>

            <div id="list-container"></div>

            <dialog id="edit-metadata-modal" style="border-radius: 8px; border: 1px solid #ccc; padding: 20px; width: 80%;">
                    <h3 style="margin-top: 0;">Edit Metadata</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <input type="text" id="edit-title" placeholder="Título de la canción">
                        <input type="text" id="edit-artist" placeholder="Artista">
                        <input type="text" id="edit-genre" placeholder="Género">
                        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                            <button id="cancel-edit-btn" style="cursor: pointer;">Cancelar</button>
                            <button id="save-metadata-btn" style="cursor: pointer; background: #222; color: white; border: none; padding: 5px 10px; border-radius: 4px;">Guardar</button>
                        </div>
                    </div>
                </dialog>
            </div>
        `;
    }

    init() {
        const addBtn = this.shadowRoot.getElementById('add-btn');
        const fileInput = this.shadowRoot.getElementById('file-input');
        const searchInput = this.shadowRoot.getElementById('search-input');
        const deleteAllContainer = this.shadowRoot.getElementById('delete-all-container');
        const deleteAllBtn = this.shadowRoot.getElementById('delete-all-btn');

        this.deleteModeBtn = this.shadowRoot.getElementById('delete-mode-btn');
        this.isDeleteMode = false;

        this.deleteModeBtn.addEventListener('click', () => {
            this.isDeleteMode = !this.isDeleteMode;
            this.deleteModeBtn.style.color = this.isDeleteMode ? 'red' : 'black';

            deleteAllContainer.style.display = this.isDeleteMode ? 'block' : 'none';
            
            // Render songs again to update the delete buttons visibility
            const searchTerm = searchInput.value.toLowerCase();
            const filteredSongs = this.currentSongs.filter(song => 
                song.title.toLowerCase().includes(searchTerm)
            );
            this.renderSongs(filteredSongs);
        });

        // Cascade deletion
        deleteAllBtn.addEventListener('click', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const filteredSongs = this.currentSongs.filter(song =>
                song.title.toLowerCase().includes(searchTerm)
            );

            if (filteredSongs.length === 0) return;

            if (confirm(`Are you sure you want to delete all ${filteredSongs.length} songs in this list? This action cannot be undone.`)) {
                filteredSongs.forEach(song => {
                    this.dispatchEvent(new CustomEvent('request-remove-song', {
                        detail: { songId: song.id },
                        bubbles: true,
                        composed: true
                    }));
                });
            }
        });
    
        addBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (event) => this.handleFiles(event));

        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            // Filter songs array
            const filteredSongs = this.currentSongs.filter(song => song.title.toLowerCase().includes(searchTerm));
            this.renderSongs(filteredSongs);
        });
    }

    handleFiles(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        //Composed: true allows the event to bypass the shadow DOM and be listened to by other components
        const addSongEvent = new CustomEvent('request-add-song', {
            detail: { files },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(addSongEvent);

        event.target.value = ''; // Reset the file input for future uploads
    }

    updateList(songs) {
        this.currentSongs = songs;
        this.shadowRoot.getElementById('search-input').value = ''; // Clear search input
        this.renderSongs(songs);
    }

    renderSongs(songsToRender) {
        const container = this.shadowRoot.getElementById('list-container');
        const editModal = this.shadowRoot.getElementById('edit-metadata-modal');
        const editTitleInput = this.shadowRoot.getElementById('edit-title');
        const editArtistInput = this.shadowRoot.getElementById('edit-artist');
        const editGenreInput = this.shadowRoot.getElementById('edit-genre');
        const cancelEditBtn = this.shadowRoot.getElementById('cancel-edit-btn');
        const saveMetadataBtn = this.shadowRoot.getElementById('save-metadata-btn');

        container.innerHTML = ''; 

        if (songsToRender.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #888;">No songs available.</p>';
            return;
        } 

        let songToEdit = null;

        cancelEditBtn.onclick = () => editModal.close();
        saveMetadataBtn.onclick = () => {
            if (songToEdit) {
                songToEdit.title = editTitleInput.value.trim() || songToEdit.title;
                songToEdit.artist = editArtistInput.value.trim();
                songToEdit.genre = editGenreInput.value.trim();

                this.dispatchEvent(new CustomEvent('request-update-song', {
                    detail: { song: songToEdit },
                    bubbles: true, composed: true
                }));
                editModal.close();
            }
        };

        songsToRender.forEach(song => {
            if (!song || !song.file || !song.title) return;

            const item = document.createElement('div');
            item.className = 'song-item';
            item.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid #ccc;
                cursor: pointer;
                transition: background-color 0.2s;
            `;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'song-name';
            nameSpan.textContent = song.artist ? `${song.title} - ${song.artist}` : song.title;
            nameSpan.style.flexGrow = '1';
            nameSpan.style.cursor = 'pointer';

            const btnContainer = document.createElement('div');
            btnContainer.style.display = 'flex';
            btnContainer.style.gap = '5px';

            const editBtn = document.createElement('button');
            editBtn.textContent = '🛠️';
            editBtn.className = 'delete-item-btn';
            editBtn.title = 'Editar metadatos';
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                songToEdit = song;
                editTitleInput.value = song.title || '';
                editArtistInput.value = song.artist || '';
                editGenreInput.value = song.genre || '';
                editModal.showModal();
            });
            btnContainer.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.className = 'delete-item-btn';
            deleteBtn.style.display = this.isDeleteMode ? 'block' : 'none';

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to remove "${song.title}" from this list?`)) {
                    this.dispatchEvent(new CustomEvent('request-remove-song', {
                        detail: { songId: song.id },
                        bubbles: true,
                        composed: true
                    }));
                }
            });
            btnContainer.appendChild(deleteBtn);

            item.appendChild(nameSpan);
            item.appendChild(btnContainer);

            nameSpan.addEventListener('click', () => {
                if (!this.isDeleteMode) {
                    this.dispatchEvent(new CustomEvent('request-play', {
                    detail: { song: song },
                    bubbles: true,
                    composed: true
                    }));
                } 
            });

            container.appendChild(item);
        });
    }   

    disconnectedCallback() {
        // Clean up any event listeners if necessary
    }
}