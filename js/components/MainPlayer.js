export class MainPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.currentAudio = new Audio(); // Native HTML5 audio element for playback
    }

    connectedCallback() {
        this.render();
        this.init();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <link rel="stylesheet" href="./css/components/MainPlayer.css">
        
        <div class="player-container">

            <img id="cover-art" src="./resources/default-cover.jpg" alt="Song Cover" width="150" height="150">
            
            <div class="info-container">
                <h2 id="track-title" class="title">Selecciona un tema</h2>
                <h3 id="track-artist" class="artist">Artista</h3>
                <h4 id="track-genre" class="genre">Género</h4>
            </div><h2 id="title">Select a Song</h2>

            <div class="progress-container">
                <span id="current-time">0:00</span>
                <input type="range" id="progress-bar" value="0" min="0" step="1">
                <span id="total-duration">0:00</span>
            </div>

            <div class="controls">
                <button id="prev-btn">⏮️</button>
                <button id="play-pause">Play</button>
                <button id="next-btn">⏭️</button>
            </div>

            <div class="volume-container">
                <button id="mute-btn">🔊</button>
                <input type="range" id="volume-bar" value="1" min="0" max="1" step="0.01">
            </div>
        </div>
        `;
    }

    init() {
        this.playPauseButton = this.shadowRoot.getElementById('play-pause');
        this.prevBtn = this.shadowRoot.getElementById('prev-btn');
        this.nextBtn = this.shadowRoot.getElementById('next-btn');
        this.progressBar = this.shadowRoot.getElementById('progress-bar');
        this.currentTimeEl = this.shadowRoot.getElementById('current-time');
        this.durationEl = this.shadowRoot.getElementById('total-duration');
        this.playPauseButton.addEventListener('click', () => this.togglePlay());
        this.volumeBar = this.shadowRoot.getElementById('volume-bar');
        this.muteBtn = this.shadowRoot.getElementById('mute-btn');

        // Metadata Elements
        this.coverArtEl = this.shadowRoot.getElementById('cover-art');
        this.titleEl = this.shadowRoot.getElementById('track-title');
        this.artistEl = this.shadowRoot.getElementById('track-artist');
        this.genreEl = this.shadowRoot.getElementById('track-genre');

        this.prevBtn.addEventListener('click', () => this.dispatchEvent(new CustomEvent('request-prev', { bubbles: true, composed: true })));
        this.nextBtn.addEventListener('click', () => this.dispatchEvent(new CustomEvent('request-next', { bubbles: true, composed: true })));
        this.currentAudio.addEventListener('ended', () => this.dispatchEvent(new CustomEvent('request-next', { bubbles: true, composed: true })));
        document.addEventListener('play-song', (event) => this.loadAndPlay(event.detail.song));
        this.currentAudio.addEventListener('loadedmetadata', () => this.setDuration());
        this.currentAudio.addEventListener('timeupdate', () => this.updateProgress());
        this.progressBar.addEventListener('input', (event) => this.seekAudio(event.target.value));
        this.volumeBar.addEventListener('input', (event) => this.setVolume(event.target.value));
        this.muteBtn.addEventListener('click', () => this.toggleMute());

    }

    loadAndPlay(songData) {
        if (!songData || !songData.file) return;

        // Converts the song data to URL
        const audioURL = URL.createObjectURL(songData.file);
        this.currentAudio.src = audioURL;
        this.currentAudio.play();
        this.playPauseButton.textContent = 'Pause';

        this.titleEl.textContent = songData.title || "Unknown Title";
        this.artistEl.textContent = songData.artist || "Unknown Artist";
        this.genreEl.textContent = songData.genre || "Unknown Genre";

        if (songData.cover) {
            const imageUrl = this.formatCoverImage(songData.cover);
            this.coverArtEl.src = imageUrl;
        } else {
            this.coverArtEl.src = './resources/default-cover.png';
        }
    }

    // Aux function to convert byte array to URL for cover images
    formatCoverImage(pictureData) {
        // Gry binary data
        const { data, format } = pictureData;
        let base64String = "";
        
        // Convert byte array to binary string
        for (let i = 0; i < data.length; i++) {
            base64String += String.fromCharCode(data[i]);
        }
        
        // Return a data URL that can be used as the src for an image element
        return `data:${format};base64,${window.btoa(base64String)}`;
    }

    togglePlay() {
        if (this.currentAudio.paused) {
            this.currentAudio.play();
        } else {
            this.currentAudio.pause();
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    setDuration() {
        this.progressBar.max = this.currentAudio.duration;
        this.durationEl.textContent = this.formatTime(this.currentAudio.duration);
    }

    updateProgress() {
        this.progressBar.value = this.currentAudio.currentTime;
        this.currentTimeEl.textContent = this.formatTime(this.currentAudio.currentTime);
    }

    seekAudio(newTime) {
        this.currentAudio.currentTime = newTime;
    }

    setVolume(value) {
        this.currentAudio.volume = value;
        if (this.currentAudio.muted) {
            this.currentAudio.muted = false;
        }
        this.updateMuteButton();
    }

    toggleMute() {
        // Inverts the muted state of the audio element
        this.currentAudio.muted = !this.currentAudio.muted;
        this.updateMuteButton();
    }

    updateMuteButton() {
        if (this.currentAudio.muted || this.currentAudio.volume === 0) {
            this.muteBtn.textContent = '🔇';
        } else if (this.currentAudio.volume < 0.5) {
            this.muteBtn.textContent = '🔈';
        } else {
            this.muteBtn.textContent = '🔊';
        }
    }

    // End of life cycle
    disconnectedCallback() {
        this.currentAudio.pause();
        this.currentAudio.src = "";
    }
}