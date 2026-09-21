import { LyricsResult, Playlist, Track } from '../types';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc
} from 'firebase/firestore';

const DB_NAME = 'vanz_music_db';
const DB_VERSION = 4;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains('playlists')) {
        const store = database.createObjectStore('playlists', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('userId', 'userId', { unique: false });
      }

      if (!database.objectStoreNames.contains('favorites')) {
        database.createObjectStore('favorites', { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains('history')) {
        const store = database.createObjectStore('history', { keyPath: 'id' });
        store.createIndex('playedAt', 'playedAt', { unique: false });
        store.createIndex('userId', 'userId', { unique: false });
      }

      if (!database.objectStoreNames.contains('cachedTracks')) {
        database.createObjectStore('cachedTracks', { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains('savedLyrics')) {
        database.createObjectStore('savedLyrics', { keyPath: 'trackId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---------------- Helper LocalStorage Fallback ----------------
function getStorageUserKey(userId: string, key: string) {
  return `vanz_user_${userId || 'guest'}_${key}`;
}

// ---------------- Playlist Methods (Per Account Isolated) ----------------
export async function getUserPlaylists(userId: string = 'guest'): Promise<Playlist[]> {
  const safeUid = userId || 'guest';
  const localKey = getStorageUserKey(safeUid, 'playlists');

  // 1. First check local fast cache
  let cachedPlaylists: Playlist[] = [];
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      cachedPlaylists = JSON.parse(raw);
    }
  } catch {}

  // 2. Query IndexedDB
  try {
    const database = await openDB();
    const idbPlaylists = await new Promise<Playlist[]>((resolve) => {
      const tx = database.transaction('playlists', 'readonly');
      const store = tx.objectStore('playlists');
      const req = store.getAll();
      req.onsuccess = () => {
        const all = (req.result as any[]) || [];
        const userItems = all
          .filter((p) => (p.userId || 'guest') === safeUid)
          .map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            coverImage: p.coverImage,
            tracks: Array.isArray(p.tracks) ? p.tracks : [],
            createdAt: p.createdAt || Date.now(),
            isCustom: p.isCustom ?? true
          }));
        resolve(userItems);
      };
      req.onerror = () => resolve([]);
    });

    if (idbPlaylists.length > 0) {
      cachedPlaylists = idbPlaylists;
    }
  } catch (err) {
    console.warn('IDB playlists read note:', err);
  }

  // If no playlist exists yet for this account, create a fresh default one
  if (cachedPlaylists.length === 0) {
    const defaultPlaylist: Playlist = {
      id: `fav-pl-${safeUid}-${Date.now()}`,
      name: 'Lagu Favorit Saya',
      description: 'Koleksi lagu paling berkesan',
      coverImage: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg',
      tracks: [],
      createdAt: Date.now(),
      isCustom: true
    };
    await saveUserPlaylist(safeUid, defaultPlaylist);
    cachedPlaylists = [defaultPlaylist];
  }

  // 3. Background Cloud Firestore Sync if online & logged in
  if (safeUid !== 'guest') {
    fetchFirestorePlaylists(safeUid).then((cloudItems) => {
      if (cloudItems && cloudItems.length > 0) {
        localStorage.setItem(localKey, JSON.stringify(cloudItems));
      }
    }).catch(() => {});
  }

  try {
    localStorage.setItem(localKey, JSON.stringify(cachedPlaylists));
  } catch {}

  return cachedPlaylists;
}

export async function saveUserPlaylist(userId: string = 'guest', playlist: Playlist): Promise<void> {
  const safeUid = userId || 'guest';
  const record = { ...playlist, userId: safeUid };

  // 1. Save to LocalStorage
  const localKey = getStorageUserKey(safeUid, 'playlists');
  try {
    const current = await getUserPlaylists(safeUid);
    const updated = [record, ...current.filter((p) => p.id !== playlist.id)];
    localStorage.setItem(localKey, JSON.stringify(updated));
  } catch {}

  // 2. Save to IndexedDB
  try {
    const database = await openDB();
    const tx = database.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    store.put(record);
  } catch (err) {
    console.warn('Failed to save playlist in IDB:', err);
  }

  // 3. Sync to Cloud Firestore
  if (safeUid !== 'guest') {
    try {
      const plRef = doc(db, 'users', safeUid, 'playlists', playlist.id);
      await setDoc(plRef, record, { merge: true });
    } catch (e) {
      console.info('Firestore playlist sync note:', e);
    }
  }
}

export async function deleteUserPlaylist(userId: string = 'guest', playlistId: string): Promise<void> {
  const safeUid = userId || 'guest';
  const localKey = getStorageUserKey(safeUid, 'playlists');

  // 1. LocalStorage
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const list: Playlist[] = JSON.parse(raw);
      const filtered = list.filter((p) => p.id !== playlistId);
      localStorage.setItem(localKey, JSON.stringify(filtered));
    }
  } catch {}

  // 2. IndexedDB
  try {
    const database = await openDB();
    const tx = database.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    store.delete(playlistId);
  } catch (err) {
    console.warn('Failed to delete playlist from IDB:', err);
  }

  // 3. Firestore
  if (safeUid !== 'guest') {
    try {
      await deleteDoc(doc(db, 'users', safeUid, 'playlists', playlistId));
    } catch (e) {
      console.info('Firestore delete playlist note:', e);
    }
  }
}

export async function addTrackToUserPlaylist(
  userId: string = 'guest', 
  playlistId: string, 
  track: Track
): Promise<Playlist | null> {
  const safeUid = userId || 'guest';
  const playlists = await getUserPlaylists(safeUid);
  const target = playlists.find((p) => p.id === playlistId);
  if (!target) return null;

  if (!target.tracks.some((t) => t.id === track.id)) {
    target.tracks.push(track);
    if (!target.coverImage && track.thumbnail) {
      target.coverImage = track.thumbnail;
    }
    await saveUserPlaylist(safeUid, target);
  }
  return target;
}

export async function removeTrackFromUserPlaylist(
  userId: string = 'guest', 
  playlistId: string, 
  trackId: string
): Promise<void> {
  const safeUid = userId || 'guest';
  const playlists = await getUserPlaylists(safeUid);
  const target = playlists.find((p) => p.id === playlistId);
  if (target) {
    target.tracks = target.tracks.filter((t) => t.id !== trackId);
    await saveUserPlaylist(safeUid, target);
  }
}

// ---------------- Favorites Methods (Per Account Isolated) ----------------
export async function getUserFavorites(userId: string = 'guest'): Promise<Track[]> {
  const safeUid = userId || 'guest';
  const localKey = getStorageUserKey(safeUid, 'favorites');

  let cached: Track[] = [];
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      cached = JSON.parse(raw);
    }
  } catch {}

  if (cached.length === 0) {
    try {
      const database = await openDB();
      cached = await new Promise<Track[]>((resolve) => {
        const tx = database.transaction('favorites', 'readonly');
        const store = tx.objectStore('favorites');
        const req = store.getAll();
        req.onsuccess = () => {
          const all = (req.result as any[]) || [];
          const userItems = all
            .filter((item) => (item.userId || 'guest') === safeUid)
            .map((item) => (item.track ? item.track : item));
          resolve(userItems);
        };
        req.onerror = () => resolve([]);
      });
    } catch {}
  }

  // Cloud Firestore Sync
  if (safeUid !== 'guest') {
    fetchFirestoreFavorites(safeUid).then((cloud) => {
      if (cloud && cloud.length > 0) {
        localStorage.setItem(localKey, JSON.stringify(cloud));
      }
    }).catch(() => {});
  }

  return cached;
}

export async function toggleUserFavorite(userId: string = 'guest', track: Track): Promise<boolean> {
  const safeUid = userId || 'guest';
  const localKey = getStorageUserKey(safeUid, 'favorites');
  let current = await getUserFavorites(safeUid);

  const exists = current.some((t) => t.id === track.id);
  let updated: Track[];
  let isAdded = false;

  if (exists) {
    updated = current.filter((t) => t.id !== track.id);
    isAdded = false;
  } else {
    updated = [{ ...track }, ...current];
    isAdded = true;
  }

  // 1. LocalStorage
  try {
    localStorage.setItem(localKey, JSON.stringify(updated));
  } catch {}

  // 2. IndexedDB
  const compositeKey = `${safeUid}_${track.id}`;
  try {
    const database = await openDB();
    const tx = database.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');
    if (isAdded) {
      store.put({ id: compositeKey, userId: safeUid, trackId: track.id, track, addedAt: Date.now() });
    } else {
      store.delete(compositeKey);
    }
  } catch {}

  // 3. Firestore
  if (safeUid !== 'guest') {
    try {
      const favRef = doc(db, 'users', safeUid, 'favorites', track.id);
      if (isAdded) {
        await setDoc(favRef, { ...track, addedAt: Date.now(), userId: safeUid });
      } else {
        await deleteDoc(favRef);
      }
    } catch (e) {
      console.info('Firestore favorite sync note:', e);
    }
  }

  return isAdded;
}

// ---------------- Play History Methods (Per Account Isolated) ----------------
export async function getUserHistory(userId: string = 'guest'): Promise<Track[]> {
  const safeUid = userId || 'guest';
  const localKey = getStorageUserKey(safeUid, 'history');

  let cached: Track[] = [];
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      cached = JSON.parse(raw);
    }
  } catch {}

  if (cached.length === 0) {
    try {
      const database = await openDB();
      cached = await new Promise<Track[]>((resolve) => {
        const tx = database.transaction('history', 'readonly');
        const store = tx.objectStore('history');
        const req = store.getAll();
        req.onsuccess = () => {
          const all = (req.result as any[]) || [];
          const userItems = all
            .filter((item) => (item.userId || 'guest') === safeUid)
            .sort((a, b) => (b.playedAt || 0) - (a.playedAt || 0))
            .map((item) => (item.track ? item.track : item));
          resolve(userItems);
        };
        req.onerror = () => resolve([]);
      });
    } catch {}
  }

  return cached;
}

export async function addUserHistory(userId: string = 'guest', track: Track): Promise<void> {
  const safeUid = userId || 'guest';
  const localKey = getStorageUserKey(safeUid, 'history');
  
  try {
    let current = await getUserHistory(safeUid);
    current = [track, ...current.filter((t) => t.id !== track.id)].slice(0, 50);
    localStorage.setItem(localKey, JSON.stringify(current));
  } catch {}

  // IndexedDB
  const compositeKey = `${safeUid}_${track.id}`;
  try {
    const database = await openDB();
    const tx = database.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    store.put({ id: compositeKey, userId: safeUid, trackId: track.id, track, playedAt: Date.now() });
  } catch {}

  // Firestore
  if (safeUid !== 'guest') {
    try {
      const histRef = doc(db, 'users', safeUid, 'history', track.id);
      await setDoc(histRef, { ...track, playedAt: Date.now(), userId: safeUid });
    } catch (e) {
      console.info('Firestore history sync note:', e);
    }
  }
}

// ---------------- Firestore Cloud Load Helpers ----------------
async function fetchFirestorePlaylists(userId: string): Promise<Playlist[]> {
  try {
    const col = collection(db, 'users', userId, 'playlists');
    const snap = await getDocs(col);
    if (!snap.empty) {
      const items: Playlist[] = [];
      snap.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          name: data.name || 'Playlist',
          description: data.description || '',
          coverImage: data.coverImage || '',
          tracks: Array.isArray(data.tracks) ? data.tracks : [],
          createdAt: data.createdAt || Date.now(),
          isCustom: data.isCustom ?? true
        });
      });
      return items;
    }
  } catch {}
  return [];
}

async function fetchFirestoreFavorites(userId: string): Promise<Track[]> {
  try {
    const col = collection(db, 'users', userId, 'favorites');
    const snap = await getDocs(col);
    if (!snap.empty) {
      const tracks: Track[] = [];
      snap.forEach((d) => {
        const data = d.data() as Track;
        tracks.push(data);
      });
      return tracks;
    }
  } catch {}
  return [];
}

// ---------------- Backwards Compatible Aliases ----------------
export const getLocalPlaylists = () => getUserPlaylists('guest');
export const saveLocalPlaylist = (p: Playlist) => saveUserPlaylist('guest', p);
export const deleteLocalPlaylist = (id: string) => deleteUserPlaylist('guest', id);
export const addTrackToPlaylist = (plId: string, t: Track) => addTrackToUserPlaylist('guest', plId, t);
export const removeTrackFromPlaylist = (plId: string, tId: string) => removeTrackFromUserPlaylist('guest', plId, tId);
export const getLocalFavorites = () => getUserFavorites('guest');
export const toggleLocalFavorite = (t: Track) => toggleUserFavorite('guest', t);
export const getLocalHistory = () => getUserHistory('guest');
export const addLocalHistory = (t: Track) => addUserHistory('guest', t);

// ---------------- Cached / Offline Tracks ----------------
export async function cacheTrackForOffline(track: Track): Promise<void> {
  try {
    const database = await openDB();
    const tx = database.transaction('cachedTracks', 'readwrite');
    const store = tx.objectStore('cachedTracks');
    store.put({ ...track, cachedAt: Date.now() });
  } catch (err) {
    console.warn('Failed to cache track:', err);
  }
}

export async function getCachedTracks(): Promise<Track[]> {
  try {
    const database = await openDB();
    return new Promise((resolve) => {
      const tx = database.transaction('cachedTracks', 'readonly');
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
    const database = await openDB();
    return new Promise((resolve) => {
      const tx = database.transaction('savedLyrics', 'readonly');
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
    const database = await openDB();
    const tx = database.transaction('savedLyrics', 'readwrite');
    const store = tx.objectStore('savedLyrics');
    store.put(lyricsResult);
  } catch (err) {
    console.warn('Failed to save lyrics to indexedDB:', err);
  }
}

export async function deleteSavedLyrics(trackId: string): Promise<void> {
  try {
    const database = await openDB();
    const tx = database.transaction('savedLyrics', 'readwrite');
    const store = tx.objectStore('savedLyrics');
    store.delete(trackId);
  } catch (err) {
    console.warn('Failed to delete saved lyrics:', err);
  }
}
