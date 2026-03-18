export class PlaylistManager extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.init();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="./css/components/PlaylistManager.css">

            <div class="playlist-manager">
                <div class="header">
                    <h3>Playlist Manager</h3>
                    <div class="actions">
                        <button id="add-btn" title="New Playlist">➕</button>
                        <button id="delete-mode-btn" title="Delete Playlist">🗑️</button>
                    </div>
                </div>

                <div class="search-bar">
                    <input type="text" id="search-input" placeholder="Search playlist... 🔎">
                </div>
                
                <div id="playlist-list" class="scrollable-list">
                    <!-- Playlists will be dynamically added here -->
                </div>

                <div id="new-playlist-dialog" class="dialog hidden">
                    <h4>New Playlist</h4>
                    <label>Name:</label>
                    <input type="text" id="playlist-name-input">
                    <div class="dialog-actions">
                        <button id="cancel-btn">Cancel</button>
                        <button id="accept-btn">Accept</button>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        this.addBtn = this.shadowRoot.getElementById('add-btn');
        this.dialog = this.shadowRoot.getElementById('new-playlist-dialog');
        this.cancelBtn = this.shadowRoot.getElementById('cancel-btn');
        this.acceptBtn = this.shadowRoot.getElementById('accept-btn');
        this.nameInput = this.shadowRoot.getElementById('playlist-name-input');
        this.deleteModeBtn = this.shadowRoot.getElementById('delete-mode-btn');

        this.isDeleteMode = false;

        // Show new playlist dialog 
        this.addBtn.addEventListener('click', () => {
            this.dialog.classList.remove('hidden');
            this.nameInput.focus();
        });

        // Hide dialog on cancel
        
        this.cancelBtn.addEventListener('click', () => {
            this.dialog.classList.add('hidden');
            this.nameInput.value = '';
        });

        // Handle new playlist creation
        this.acceptBtn.addEventListener('click', () => this.createNewPlaylist());

        // Delete playlist mode toggle
        this.deleteModeBtn.addEventListener('click', () => {
            this.isDeleteMode = !this.isDeleteMode;
            this.deleteModeBtn.style.color = this.isDeleteMode ? 'red' : 'black';
            this.dispatchEvent(new CustomEvent('request-refresh-playlist', { bubbles: true, composed: true }));
        });
    }

    createNewPlaylist() {
        const name = this.nameInput.value.trim();
        if (!name) return;

        // New event
        const createEvent = new CustomEvent('request-create-playlist', {
            detail: { name: name, songIds: [] }, 
            bubbles: true,
            composed: true 
        });
        this.dispatchEvent(createEvent);

        // Clean and hide dialog
        this.nameInput.value = '';
        this.dialog.classList.add('hidden');
    }

    updateList(playlists) {
        const listContainer = this.shadowRoot.getElementById('playlist-list');
        listContainer.innerHTML = ''; // Clear current list
        
        if (playlists.length === 0) {
            listContainer.innerHTML = '<p class="empty-msg">No playlists found.</p>';
            return;
        }

        playlists.forEach(playlist => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            item.textContent = playlist.name;

            // Name container
            const nameSpam = document.createElement('span');
            nameSpam.textContent = playlist.name;
            nameSpam.style.flex = '1';

            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.className = 'delete-item-btn';
            deleteBtn.style.display = this.isDeleteMode ? 'block' : 'none';

            item.appendChild(nameSpam);
            item.appendChild(deleteBtn);

            // Event for selecting a playlist
            nameSpam.addEventListener('click', () => {
                if (!this.isDeleteMode) {
                    this.dispatchEvent(new CustomEvent('request-select-playlist', {
                        detail: { playlist: playlist },
                        bubbles: true,
                        composed: true
                    }));
                }
            });

            // Event to delete a playlist
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent triggering the select event
                if (confirm(`Are you sure you want to delete the playlist "${playlist.name}"?`)) {
                    this.dispatchEvent(new CustomEvent('request-delete-playlist', {
                        detail: { id: playlist.id },
                        bubbles: true,
                        composed: true
                    }));
                }
            });

            listContainer.appendChild(item);
        });
    }

    disconnectedCallback() {
        // Clean up any event listeners if necessary
    }
}