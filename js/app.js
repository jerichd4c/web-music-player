import { MusicDB } from './db/db.js';
import { MainPlayer } from './components/MainPlayer.js';
import { SongList } from './components/SongList.js';    
import { PlaylistManager } from './components/PlaylistManager.js';

const db = new MusicDB();

customElements.define('main-player', MainPlayer);
customElements.define('song-list', SongList);
customElements.define('playlist-manager', PlaylistManager);

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await db.init();
        console.log('Database initialized successfully, components can be rendered');

        const songListEl = document.querySelector('song-list');
        const mainPlayerEl = document.querySelector('main-player');
        const playlistManagerEl = document.querySelector('playlist-manager');
        
        let currentQueue = [];
        let currentIndex = -1;
        let activePlaylist = null; // Track the currently active playlist 

        // Aux function to reaload the list
        const loadSongsFromDB = async () => {
            currentQueue = await db.getAllSongs();
            songListEl.updateList(currentQueue);
        };

        // Aux function to reload the playlists
        const loadPlaylistsFromDB = async () => {
            const playlists = await db.getAllPlaylists();
            playlistManagerEl.updateList(playlists);
        };

        // 1. Load songs stored in the database AND playlists
        await loadSongsFromDB();
        await loadPlaylistsFromDB();

        // IMPORTANT: No songs will be loaded initially until a playlist is selected
        songListEl.updateList([]);

        // 2. Listen when a song is added
        document.addEventListener('request-add-song', async (event) => {
            if (!activePlaylist) {
                alert('Please select a playlist before adding songs.');
                return;
            }

            const files = event.detail.files;
            const songsInCurrentPlaylist = await db.getSongsByIds(activePlaylist.songIds || []);

            // Save every uploaded file to the database
            for (const file of files) {

               const isDuplicate = songsInCurrentPlaylist.find(s => 
                    s.file.name === file.name && s.file.size === file.size
                );

                if (isDuplicate) {
                    const proceed = confirm(`The song "${file.name}" already exists in the directory. Do you want to add it anyway?`);
                    if (!proceed) continue; 
                }

                // Save to DB
                const newSongId= await db.addSong(file);

                // Update the current playlist with the new song ID
                activePlaylist.songIds.push(newSongId);
            }

            // Reload songs and playlists to reflect changes
            await db.updatePlaylist(activePlaylist);
            
            // Refresh the song list with songs from the active playlist
            const songsInPlaylist = await db.getSongsByIds(activePlaylist.songIds);
            songListEl.updateList(songsInPlaylist);
        });

        // 3. Listen to the request and connects to the audio player
        document.addEventListener('request-play', (event) => {
            const songToPlay= event.detail.song;
            // Find the index of the song to play in the current queue
            currentIndex = currentQueue.findIndex(s => s.id === songToPlay.id);
            mainPlayerEl.loadAndPlay(songToPlay);
        });

        // 4. Next Button
        mainPlayerEl.addEventListener('request-next', () => {
            if (currentQueue.length === 0) return; 
            // Move to the next song, goes to 0 if at the end
            currentIndex = (currentIndex + 1) % currentQueue.length;
            mainPlayerEl.loadAndPlay(currentQueue[currentIndex]);
        });

        // 5. Previous Button
        mainPlayerEl.addEventListener('request-prev', () => {
            if (currentQueue.length === 0) return; 
            // Move to the previous song, goes to the last if at the start
            currentIndex = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
            mainPlayerEl.loadAndPlay(currentQueue[currentIndex]);
        });

        // 6. Listen to playlist creation
        document.addEventListener('request-create-playlist', async (event) => {
            const newPlaylist = event.detail;
            await db.addPlaylist(newPlaylist);
            await loadPlaylistsFromDB();
        });

        // 7. Select a playlist
        document.addEventListener('request-select-playlist', async (event) => {
            activePlaylist = event.detail.playlist;
            console.log('Selected playlist:', activePlaylist.name);
            // Get songs from the ID of the playlist
            const songsInPlaylist = await db.getSongsByIds(activePlaylist.songIds || []);
            songListEl.updateList(songsInPlaylist);
        });

        // 8. Reload playlist after changes
        document.addEventListener('request-refresh-playlist', async (event) => {
           await loadPlaylistsFromDB(); 
        });

        // 9. Handle playlist deletion
        document.addEventListener('request-delete-playlist', async (event) => {
            const playlistIdToDelete = event.detail.id;

            // 1. Get full playlist details to access song IDs before deletion
            const playlists = await db.getAllPlaylists();
            const playlistToDelete = playlists.find(p => p.id === playlistIdToDelete);

            // 2. Delete songs in the playlist
            if (playlistToDelete && playlistToDelete.songIds) {
                for (const songId of playlistToDelete.songIds) {
                    await db.deleteSong(songId);
                }
            }

            await db.deletePlaylist(playlistIdToDelete);

            // If the deleted playlist was active, reset the song list and active playlist
            if (activePlaylist && activePlaylist.id === playlistIdToDelete) {
                activePlaylist = null;
                songListEl.updateList([]);
            }
            await loadPlaylistsFromDB();
        });

        // 10. Handle song deletion
        document.addEventListener('request-remove-song', async (event) => {
            const songIdToRemove = event.detail.songId;

            // If there's an active playlist, remove the song ID
            if (activePlaylist) {
                // 1. Filter array of songs in the playlist to remove the song ID
                activePlaylist.songIds = activePlaylist.songIds.filter(id => id !== songIdToRemove);

                // 2. Update the playlist in the database
                await db.updatePlaylist(activePlaylist);

            }

            // 3. Delete the file from the songs store
            await db.deleteSong(songIdToRemove);

            if (activePlaylist) {
                // 4. Refresh the song list with songs from the active playlist
                const songsInPlaylist = await db.getSongsByIds(activePlaylist.songIds);
                songListEl.updateList(songsInPlaylist);

                currentQueue = songsInPlaylist; // Update the current queue to reflect the removed song
            } else {

                await loadSongsFromDB(); // If no active playlist, just reload all songs
            }
        });

    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
});