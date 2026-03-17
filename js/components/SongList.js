export class SongList extends HTMLElement {
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
        <link rel="stylesheet" href="./css/components/SongList.css">
        <div class="header">
            <h2>My Songs</h2>
            <button class="add-song" id="add-song">Add Song</button>
            <input type="file" id="file-input" accept="audio/mp3, audio/m4a" multiple hidden>
        </div>
        <div id="list-container"></div>
        `;
    }

    init() {
        const addBtn = this.shadowRoot.getElementById('add-song');
        const fileInput = this.shadowRoot.getElementById('file-input');

        addBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (event) => this.handleFiles(event));
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
        const container = this.shadowRoot.getElementById('list-container');
        container.innerHTML = ''; // Clear existing list

        if (songs.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #888;">No songs available.</p>';
            return;
        } 

        songs.forEach(song => {

            // Error handling
            if (!song || !song.file || !song.title) {
                console.error('Invalid song data:', song);
                return;
            }

            const item = document.createElement('div');
            item.style.cssText = `
                padding: 10px;
                border-bottom: 1px solid #ccc;
                cursor: pointer;
                transition: background-color 0.2s;
            `;
            item.textContent = song.title;

            // Hover effect
            item.onmouseover = () => item.style.background = '#333';
            item.onmouseout = () => item.style.background = 'transparent';

            // When a song is clicked, request the main player to play it
            item.addEventListener('click', () => {
                const playEvent = new CustomEvent('request-play', {
                    detail: { song: song },
                    bubbles: true,
                    // Bypass shadow DOM to allow main player to listen to this event
                    composed: true
                });
                this.dispatchEvent(playEvent);
            });

            container.appendChild(item);
        });
    }   

    disconnectedCallback() {
        // Clean up any event listeners if necessary
    }
}