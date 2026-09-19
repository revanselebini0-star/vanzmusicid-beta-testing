import { LyricsResult, Playlist, Track } from '../types';

const DB_NAME = 'vanz_music_db';
const DB_VERSION = 3;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('playlists')) {
        const store = db.createObjectStore('playlists', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('history')) {
        const store = db.createObjectStore('history', { keyPath: 'id' });
        store.createIndex('playedAt', 'playedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('cachedTracks')) {
        db.createObjectStore('cachedTracks', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('savedLyrics')) {
        db.createObjectStore('savedLyrics', { keyPath: 'trackId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---------------- Playlist Methods ----------------
export async function getLocalPlaylists(): Promise<Playlist[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('playlists', 'readonly');
      const store = tx.objectStore('playlists');
      const request = store.getAll();
      request.onsuccess = () => {
        const results = (request.result as Playlist[]) || [];
        // Default initial playlist if empty
        if (results.length === 0) {
          const defaultPlaylist: Playlist = {
            id: 'favorite-songs',
            name: 'Lagu Favorit Saya',
            description: 'Koleksi lagu paling berkesan',
            coverImage: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg',
            tracks: [],
            createdAt: Date.now(),
            isCustom: true
          };
          saveLocalPlaylist(defaultPlaylist).then(() => resolve([defaultPlaylist]));
        } else {
          resolve(results);
        }
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.error('Failed to get playlists from IndexedDB:', err);
    return [];
  }
}

export async function saveLocalPlaylist(playlist: Playlist): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    const req = store.put(playlist);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLocalPlaylist(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function addTrackToPlaylist(playlistId: string, track: Track): Promise<Playlist | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    const getReq = store.get(playlistId);

    getReq.onsuccess = () => {
      const playlist = getReq.result as Playlist;
      if (!playlist) {
        resolve(null);
        return;
      }
      // Check if track already in playlist
      if (!playlist.tracks.some(t => t.id === track.id)) {
        playlist.tracks.push(track);
        if (!playlist.coverImage && track.thumbnail) {
          playlist.coverImage = track.thumbnail;
        }
        store.put(playlist);
      }
      resolve(playlist);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    const getReq = store.get(playlistId);

    getReq.onsuccess = () => {
      const playlist = getReq.result as Playlist;
      if (playlist) {
        playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
        store.put(playlist);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

// ---------------- Favorites Methods ----------------
export async function getLocalFavorites(): Promise<Track[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('favorites', 'readonly');
      const store = tx.objectStore('favorites');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as Track[]) || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.error('Error fetching favorites:', err);
    return [];
  }
}

export async function toggleLocalFavorite(track: Track): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');
    const getReq = store.get(track.id);

    getReq.onsuccess = () => {
      if (getReq.result) {
        store.delete(track.id);
        resolve(false); // removed
      } else {
        store.put({ ...track, addedAt: Date.now() });
        resolve(true); // added
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

// ---------------- Play History Methods ----------------
export async function getLocalHistory(): Promise<Track[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('history', 'readonly');
      const store = tx.objectStore('history');
      const req = store.getAll();
      req.onsuccess = () => {
        const results = ((req.result as any[]) || []).sort((a, b) => (b.playedAt || 0) - (a.playedAt || 0));
        resolve(results);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function addLocalHistory(track: Track): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    store.put({ ...track, playedAt: Date.now() });
  } catch (err) {
    console.warn('Failed to add to history:', err);
  }
}

// ---------------- Cached / Offline Tracks ----------------
export async function cacheTrackForOffline(track: Track): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('cachedTracks', 'readwrite');
    const store = tx.objectStore('cachedTracks');
    store.put({ ...track, cachedAt: Date.now() });
  } catch (err) {
    console.warn('Failed to cache track:', err);
  }
}

export async function getCachedTracks(): Promise<Track[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('cachedTracks', 'readonly');
      const store = tx.objectStore('cachedTracks');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as Track[]) || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// ---------------- Saved & Custom Lyrics ----------------
export async function getSavedLyrics(trackId: string): Promise<LyricsResult | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('savedLyrics', 'readonly');
      const store = tx.objectStore('savedLyrics');
      const req = store.get(trackId);
      req.onsuccess = () => resolve((req.result as LyricsResult) || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveCustomLyrics(lyricsResult: LyricsResult): Promise<void> {
  if (!lyricsResult.trackId) return;
  try {
    const db = await openDB();
    const tx = db.transaction('savedLyrics', 'readwrite');
    const store = tx.objectStore('savedLyrics');
    store.put(lyricsResult);
  } catch (err) {
    console.warn('Failed to save lyrics to indexedDB:', err);
  }
}

export async function deleteSavedLyrics(trackId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('savedLyrics', 'readwrite');
    const store = tx.objectStore('savedLyrics');
    store.delete(trackId);
  } catch (err) {
    console.warn('Failed to delete saved lyrics:', err);
  }
}
