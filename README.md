# Web Audio Manager 🎵

A playlist management system and local audio player based on IndexedDB. It features a modern YouTube Music-inspired dark mode aesthetic and native browser APIs to handle audio playback, metadata extraction, and local storage.

## Quick Start 🚀

- Open `index.html` in your browser using a local web server (e.g., Live Server, Python `http.server`) as ES6 modules and IndexedDB require it.
- Use the **Playlist Manager** on the left side to create and organize your playlists.
- Select a Playlist, then click the **➕** button to upload local audio files (MP3, WAV, FLAC, etc.).
- Click any song in the list to start playback.
- Use the **Main Player** bar at the bottom to control volume, track progress, or skip songs.

## Features & Screens 🧭

- **Song List**: A central hub to upload and view your local audio files. Automatically extracts Track, Artist, and Genre data.
- **Playlist Manager**: Create custom playlists, filter them via search, and easily delete them.
- **Main Player**: A persistent bottom-bar player to manage audio playback, volume controls, and display the current track's cover art.
- **Metadata Editing**: Edit song titles, artists, and genres manually via an intuitive modal dialog.
- **Responsive Layout**: A locked, full-screen (`100vw`/`100vh`) application interface that maintains structural integrity perfectly avoiding breaks on zoom.

## Controls & Configuration ⚙️

- **Data Entry**: Upload multiple audio files simultaneously using your system's file browser.
- **Organization**: Select an active playlist before uploading songs to automatically group them.
- **Search**: Use the built-in search bars to instantly filter your playlists or song libraries.
- **Persistence**: Your songs (stored as BLOBs), metadata, and playlists are saved automatically using the browser's IndexedDB, so they persist even after you close the browser.
- **Cascade Deletion**: Use the "Delete All" feature to delete lists and automatically clean up associated songs seamlessly.

## Technical Notes 🛠️

- **Architecture**: Built using a modular component-based architecture (`MainPlayer`, `PlaylistManager`, `SongList`) using native Web Components and a central `app.js` controller.
- **Data Storage**: Uses IndexedDB for robust client-side storage of audio files and playback configurations to act completely offline.
- **Styling**: Modular CSS structure (Global Styles and UI components) strictly designed around a pristine dark theme with no external CSS frameworks.
- **Dependencies**: Integrates the `jsmediatags` library for reading ID3 audio metadata dynamically.
- **State Management**: Implements an event-driven pattern dispatching `CustomEvents` across the Shadow DOM to synchronize audio playback across components.

## Files 📁

- `index.html` — Main entry point and application shell.
- `js/app.js` — Core logic, DB initialization, and component coordination.
- `js/db/db.js` — IndexedDB wrapper and schema definition.
- `js/components/` — Individual logic and HTML encapsulation for `MainPlayer`, `PlaylistManager`, and `SongList`.
- `css/` — Organized styles (Base Layout, Components).
- `resources/` — Fallback cover arts and default graphics.
