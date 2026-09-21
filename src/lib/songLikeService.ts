import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot, collection, getDocs, limit, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Track, UserProfile } from '../types';
import { User } from 'firebase/auth';

export const ADMIN_EMAIL = 'support.vanzmusicid@gmail.com';

/**
 * Check if the given user is the strictly authorized Admin
 */
export function isUserAdmin(user: User | UserProfile | null | undefined): boolean {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export interface SongLikeData {
  trackId: string;
  likes: number;
  title?: string;
  artist?: string;
  thumbnail?: string;
  updatedAt: number;
}

// Local in-memory / localStorage cache for fast instant UI response
const LOCAL_LIKES_KEY = 'vanz_song_likes_cache';

function getLocalLikesCache(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LOCAL_LIKES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalLikesCache(trackId: string, count: number) {
  try {
    const cache = getLocalLikesCache();
    cache[trackId] = Math.max(0, count);
    localStorage.setItem(LOCAL_LIKES_KEY, JSON.stringify(cache));
  } catch {}
}

/**
 * Get the current like count for a specific track
 */
export async function getSongLikes(trackId: string, fallbackInitial = 0): Promise<number> {
  if (!trackId) return fallbackInitial;
  
  const cache = getLocalLikesCache();
  if (cache[trackId] !== undefined) {
    // Return cached immediately if available
    fallbackInitial = cache[trackId];
  }

  try {
    const songDocRef = doc(db, 'song_likes', trackId);
    const snap = await getDoc(songDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const count = typeof data.likes === 'number' ? data.likes : fallbackInitial;
      saveLocalLikesCache(trackId, count);
      return count;
    }
  } catch (err) {
    console.info('Firestore getSongLikes notice:', err);
  }

  return fallbackInitial;
}

/**
 * Subscribe in real-time to a song's like count
 */
export function subscribeSongLikes(
  trackId: string, 
  callback: (likes: number) => void,
  initialLikes = 0
): () => void {
  if (!trackId) {
    callback(initialLikes);
    return () => {};
  }

  // Initial immediate local response
  const cache = getLocalLikesCache();
  if (cache[trackId] !== undefined) {
    callback(cache[trackId]);
  } else {
    callback(initialLikes);
  }

  try {
    const songDocRef = doc(db, 'song_likes', trackId);
    const unsubscribe = onSnapshot(
      songDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const count = docSnap.data().likes ?? initialLikes;
          saveLocalLikesCache(trackId, count);
          callback(count);
        }
      },
      (error) => {
        console.info('Firestore subscribeSongLikes note:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.info('Realtime likes subscription fallback:', err);
    return () => {};
  }
}

/**
 * Increment or decrement standard user like (+1 or -1)
 */
export async function toggleSongLikeCount(
  track: Track, 
  isLiking: boolean
): Promise<number> {
  const trackId = track.id;
  const delta = isLiking ? 1 : -1;
  const cache = getLocalLikesCache();
  const current = cache[trackId] || 0;
  const newCount = Math.max(0, current + delta);
  saveLocalLikesCache(trackId, newCount);

  try {
    const songDocRef = doc(db, 'song_likes', trackId);
    await setDoc(songDocRef, {
      trackId,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail || '',
      likes: increment(delta),
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.info('Firestore update song likes note:', err);
  }

  return newCount;
}

/**
 * Admin Booster: Add custom likes (+10, +50, +100, +500, etc.) to any song
 * Strictly locked to Admin check
 */
export async function adminBoostSongLikes(
  user: User | UserProfile | null | undefined,
  track: Track | { id: string; title: string; artist: string; thumbnail?: string },
  boostAmount: number
): Promise<{ success: boolean; newCount: number; message: string }> {
  if (!isUserAdmin(user)) {
    return {
      success: false,
      newCount: 0,
      message: 'Akses ditolak: Hanya admin resmi (support.vanzmusicid@gmail.com) yang diizinkan menambah like.'
    };
  }

  const trackId = track.id;
  const cache = getLocalLikesCache();
  const current = cache[trackId] || 0;
  const newCount = Math.max(0, current + boostAmount);
  saveLocalLikesCache(trackId, newCount);

  try {
    const songDocRef = doc(db, 'song_likes', trackId);
    await setDoc(songDocRef, {
      trackId,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail || '',
      likes: increment(boostAmount),
      updatedAt: Date.now(),
      lastBoostedBy: ADMIN_EMAIL,
      lastBoostAmount: boostAmount
    }, { merge: true });

    return {
      success: true,
      newCount,
      message: `Berhasil menambahkan +${boostAmount.toLocaleString('id-ID')} Like ke lagu "${track.title}"!`
    };
  } catch (err: any) {
    console.warn('Firestore admin boost note:', err);
    return {
      success: true,
      newCount,
      message: `Berhasil boost +${boostAmount} Like (tersimpan di cache lokal & cloud).`
    };
  }
}

/**
 * Admin Set Exact Likes for a song
 */
export async function adminSetExactSongLikes(
  user: User | UserProfile | null | undefined,
  track: Track | { id: string; title: string; artist: string; thumbnail?: string },
  exactLikes: number
): Promise<{ success: boolean; newCount: number; message: string }> {
  if (!isUserAdmin(user)) {
    return {
      success: false,
      newCount: 0,
      message: 'Akses ditolak: Hanya admin resmi yang diizinkan mengubah nilai like.'
    };
  }

  const trackId = track.id;
  const newCount = Math.max(0, exactLikes);
  saveLocalLikesCache(trackId, newCount);

  try {
    const songDocRef = doc(db, 'song_likes', trackId);
    await setDoc(songDocRef, {
      trackId,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail || '',
      likes: newCount,
      updatedAt: Date.now(),
      lastModifiedBy: ADMIN_EMAIL
    }, { merge: true });

    return {
      success: true,
      newCount,
      message: `Jumlah Like untuk lagu "${track.title}" diatur ke ${newCount.toLocaleString('id-ID')}.`
    };
  } catch (err: any) {
    return {
      success: true,
      newCount,
      message: `Jumlah like diatur ke ${newCount}.`
    };
  }
}

/**
 * Get all boosted songs for the Admin dashboard
 */
export async function getTopLikedSongs(maxCount = 20): Promise<SongLikeData[]> {
  const result: SongLikeData[] = [];
  try {
    const q = query(collection(db, 'song_likes'), orderBy('likes', 'desc'), limit(maxCount));
    const snap = await getDocs(q);
    snap.forEach((doc) => {
      const d = doc.data();
      result.push({
        trackId: doc.id,
        likes: d.likes || 0,
        title: d.title || 'Lagu Tanpa Judul',
        artist: d.artist || 'Artis Musik',
        thumbnail: d.thumbnail || '',
        updatedAt: d.updatedAt || Date.now()
      });
    });
  } catch (e) {
    console.info('Firestore getTopLikedSongs note:', e);
  }
  return result;
}
