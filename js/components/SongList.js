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

            <input type="file" id="file-input" accept="audio/*" multiple style="display: none;">

            <div id="list-container"></div>
                </div>
            </div>
        `;
    }

    init() {
        const addBtn = this.shadowRoot.getElementById('add-btn');
        const fileInput = this.shadowRoot.getElementById('file-input');
        const searchInput = this.shadowRoot.getElementById('search-input');

        this.deleteModeBtn = this.shadowRoot.getElementById('delete-mode-btn');
        this.isDeleteMode = false;

        this.deleteModeBtn.addEventListener('click', () => {
            this.isDeleteMode = !this.isDeleteMode;
            this.deleteModeBtn.style.color = this.isDeleteMode ? 'red' : 'black';
            
            // Render songs again to update the delete buttons visibility
            const searchTerm = searchInput.value.toLowerCase();
            const filteredSongs = this.currentSongs.filter(song => 
                song.title.toLowerCase().includes(searchTerm)
            );
            this.renderSongs(filteredSongs);
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
        container.innerHTML = ''; // Clear existing list

        if (songsToRender.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #888;">No songs available.</p>';
            return;
        } 

        songsToRender.forEach(song => {

            // Error handling
            if (!song || !song.file || !song.title) {
                console.error('Invalid song data:', song);
                return;
            }

            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid #ccc;
                cursor: pointer;
                transition: background-color 0.2s;
            `;

            // Play icon
            const nameSpan = document.createElement('span');
            nameSpan.textContent = song.title;
            nameSpan.style.flexGrow = '1';
            nameSpan.style.cursor = 'pointer';

            // Delete icon
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.className = 'delete-item-btn';
            deleteBtn.style.display = this.isDeleteMode ? 'block' : 'none';

            item.appendChild(nameSpan);
            item.appendChild(deleteBtn);

            // When a song is clicked, request the main player to play it
            nameSpan.addEventListener('click', () => {
                if (!this.isDeleteMode) {
                    this.dispatchEvent(new CustomEvent('request-play', {
                    detail: { song: song },
                    bubbles: true,
                    // Bypass shadow DOM to allow main player to listen to this event
                    composed: true
                    }));
                } 
            });

            // When delete button is clicked, request the main app to remove the song from the database
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que se dispare el evento de reproducir al hacer clic en borrar
                if (confirm(`Are you sure you want to remove "${song.title}" from this list?`)) {
                    this.dispatchEvent(new CustomEvent('request-remove-song', {
                        detail: { songId: song.id },
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