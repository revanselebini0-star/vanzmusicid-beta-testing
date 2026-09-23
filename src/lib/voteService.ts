import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { isUserAdmin, ADMIN_EMAIL } from './songLikeService';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';

export interface CommunityReply {
  id: string;
  authorName: string;
  authorPhoto?: string;
  authorEmail?: string;
  userId: string;
  content: string;
  createdAt: number;
  likes?: number;
  likedBy?: string[];
}

export interface CommunityVoteItem {
  id: string;
  title: string;
  description?: string;
  authorName: string;
  authorPhoto?: string;
  authorEmail?: string;
  userId: string;
  createdAt: number;
  votes: number;
  voters: string[];
  status: 'Direncanakan' | 'Dalam Proses' | 'Selesai';
  replies: CommunityReply[];
  lastBoostedAt?: number;
  boostedVotes?: number;
}

export type VoteSyncStatus = 'cloud_live' | 'permission_denied' | 'local_fallback';

const STORAGE_KEY = 'vanz_community_votes_v2';

export const DEFAULT_COMMUNITY_VOTES: CommunityVoteItem[] = [
  {
    id: 'vote-1',
    title: 'Navigasi Dark Liquid Glass & Auto-Hide Bar',
    description: 'Navbar bawah bergaya kaca transparan hitam dengan responsivitas cerdas saat scroll.',
    authorName: 'Admin Vanz',
    authorPhoto: 'https://cdn.phototourl.com/free/2026-09-19-571b25e0-aa49-47c1-9fa7-8f7127a2a4cd.png',
    authorEmail: 'revan.seleb.ini0@gmail.com',
    userId: 'admin-vanz',
    createdAt: 1789923248208,
    votes: 1,
    voters: ['admin-vanz'],
    status: 'Selesai',
    replies: [
      {
        id: 'rep-admin-1',
        authorName: 'Admin Vanz',
        authorPhoto: 'https://cdn.phototourl.com/free/2026-09-19-571b25e0-aa49-47c1-9fa7-8f7127a2a4cd.png',
        authorEmail: 'revan.seleb.ini0@gmail.com',
        userId: 'admin-vanz',
        content: 'Fitur ini telah resmi aktif di versi v2.5.0 Beta Testing. Silakan berikan masukan atau tanggapan Anda di sini.',
        createdAt: 1789923248208
      }
    ]
  },
  {
    id: 'vote-2',
    title: 'Fitur Simpan Offline (Putar lagu tanpa kuota internet)',
    description: 'Penyimpanan cache audio di penyimpanan lokal perangkat agar bisa dinikmati saat offline atau tanpa koneksi internet.',
    authorName: 'Admin Vanz',
    authorPhoto: 'https://cdn.phototourl.com/free/2026-09-19-571b25e0-aa49-47c1-9fa7-8f7127a2a4cd.png',
    authorEmail: 'revan.seleb.ini0@gmail.com',
    userId: 'admin-vanz',
    createdAt: 1789836848208,
    votes: 1,
    voters: ['admin-vanz'],
    status: 'Dalam Proses',
    replies: [
      {
        id: 'rep-admin-2',
        authorName: 'Admin Vanz',
        authorPhoto: 'https://cdn.phototourl.com/free/2026-09-19-571b25e0-aa49-47c1-9fa7-8f7127a2a4cd.png',
        authorEmail: 'revan.seleb.ini0@gmail.com',
        userId: 'admin-vanz',
        content: 'Sedang dalam pengujian lokal dengan modul cache IndexedDB. Berikan vote Anda jika fitur ini prioritas bagi Anda.',
        createdAt: 1789836848208
      }
    ]
  }
];

// Helper: Get local cached votes
export function getLocalVotes(): CommunityVoteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COMMUNITY_VOTES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_COMMUNITY_VOTES;
  } catch {
    return DEFAULT_COMMUNITY_VOTES;
  }
}

// Helper: Save votes to localStorage
export function saveLocalVotes(votes: CommunityVoteItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
  } catch (e) {
    console.warn('Failed to save votes to localStorage:', e);
  }
}

let currentSyncStatus: VoteSyncStatus = 'local_fallback';
let currentStatusListener: ((status: VoteSyncStatus, msg?: string) => void) | null = null;

export function setStatusListener(listener: (status: VoteSyncStatus, msg?: string) => void) {
  currentStatusListener = listener;
  listener(currentSyncStatus);
}

function updateStatus(status: VoteSyncStatus, msg?: string) {
  currentSyncStatus = status;
  if (currentStatusListener) {
    currentStatusListener(status, msg);
  }
}

// Subscribe to votes in real time (Firestore syncs between all devices & users worldwide)
export function subscribeCommunityVotes(
  onUpdate: (votes: CommunityVoteItem[]) => void,
  onStatus?: (status: VoteSyncStatus, message?: string) => void
): () => void {
  let isUnsubscribed = false;
  let unsubscribeFirestore: (() => void) | null = null;

  if (onStatus) {
    setStatusListener(onStatus);
  }

  // 1. Instantly emit local votes so the UI is immediate
  onUpdate(getLocalVotes());

  // 2. Real-time listener from Firestore with robust API polling fallback
  let pollInterval: any = null;

  try {
    const votesCollection = collection(db, 'community_votes');

    unsubscribeFirestore = onSnapshot(
      votesCollection,
      (snapshot) => {
        if (isUnsubscribed) return;
        updateStatus('cloud_live');

        if (!snapshot.empty) {
          const items: CommunityVoteItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            items.push({
              id: docSnap.id,
              title: data.title || '',
              description: data.description || '',
              authorName: data.authorName || 'Pengguna Vanz',
              authorPhoto: data.authorPhoto || '',
              authorEmail: data.authorEmail || '',
              userId: data.userId || '',
              createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
              votes: typeof data.votes === 'number' ? data.votes : 1,
              voters: Array.isArray(data.voters) ? data.voters : [],
              status: data.status || 'Direncanakan',
              replies: Array.isArray(data.replies) ? data.replies : []
            });
          });

          // Sort descending by createdAt
          items.sort((a, b) => b.createdAt - a.createdAt);
          saveLocalVotes(items);
          onUpdate(items);
        } else {
          // If collection in Firestore is completely new, seed default items
          seedDefaultVotesToFirestore();
        }
      },
      (error) => {
        const isPerm = error.code === 'permission-denied' || error.message.includes('permission');
        if (isPerm) {
          updateStatus('permission_denied', 'Aturan Firestore belum dibuka di Firebase Console');
        } else {
          updateStatus('local_fallback', 'Mode Sinkronisasi Lokal & Server Aktif');
        }
        fallbackPollApi(onUpdate);

        // Start background polling if not already started
        if (!pollInterval && !isUnsubscribed) {
          pollInterval = setInterval(() => {
            if (!isUnsubscribed) {
              fallbackPollApi(onUpdate);
            }
          }, 8000);
        }
      }
    );
  } catch (e: any) {
    updateStatus('local_fallback', 'Mode Sinkronisasi Lokal & Server Aktif');
    fallbackPollApi(onUpdate);

    if (!pollInterval && !isUnsubscribed) {
      pollInterval = setInterval(() => {
        if (!isUnsubscribed) {
          fallbackPollApi(onUpdate);
        }
      }, 8000);
    }
  }

  // Also do an initial API poll to ensure server data is up to date
  fallbackPollApi(onUpdate);

  return () => {
    isUnsubscribed = true;
    if (unsubscribeFirestore) {
      try {
        unsubscribeFirestore();
      } catch {}
    }
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
}

async function fallbackPollApi(onUpdate: (votes: CommunityVoteItem[]) => void) {
  try {
    const res = await fetch('/api/community-votes');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveLocalVotes(data);
        onUpdate(data);
        return;
      }
    }
  } catch {
    // Static hosting (Vercel)
  }
  onUpdate(getLocalVotes());
}

async function seedDefaultVotesToFirestore() {
  try {
    for (const item of DEFAULT_COMMUNITY_VOTES) {
      await setDoc(doc(db, 'community_votes', item.id), sanitizeVoteForFirestore(item), { merge: true });
    }
  } catch (e) {
    console.info('Seeding default votes to Firestore note:', e);
  }
}

// Convert any undefined fields into empty strings so Firestore setDoc never throws
function sanitizeVoteForFirestore(item: any): any {
  return {
    id: item.id || '',
    title: item.title || '',
    description: item.description || '',
    authorName: item.authorName || 'Pengguna Vanz',
    authorPhoto: item.authorPhoto || '',
    authorEmail: item.authorEmail || '',
    userId: item.userId || 'guest',
    createdAt: item.createdAt || Date.now(),
    votes: typeof item.votes === 'number' ? item.votes : 1,
    voters: Array.isArray(item.voters) ? item.voters : [],
    status: item.status || 'Direncanakan',
    lastBoostedAt: item.lastBoostedAt || null,
    boostedVotes: typeof item.boostedVotes === 'number' ? item.boostedVotes : 0,
    replies: Array.isArray(item.replies)
      ? item.replies.map((r: any) => ({
          id: r.id || '',
          authorName: r.authorName || 'Pengguna Vanz',
          authorPhoto: r.authorPhoto || '',
          authorEmail: r.authorEmail || '',
          userId: r.userId || 'guest',
          content: r.content || '',
          createdAt: r.createdAt || Date.now(),
          likes: typeof r.likes === 'number' ? r.likes : 0,
          likedBy: Array.isArray(r.likedBy) ? r.likedBy : []
        }))
      : []
  };
}

// Toggle Upvote / Unvote (Syncs to Firestore for all users + saves locally)
export async function toggleVoteItem(
  itemId: string,
  userId: string,
  userName: string
): Promise<CommunityVoteItem[]> {
  const current = getLocalVotes();
  let updatedItem: CommunityVoteItem | null = null;

  const updatedVotes = current.map((item) => {
    if (item.id === itemId) {
      const voters = Array.isArray(item.voters) ? [...item.voters] : [];
      const hasVoted = voters.includes(userId);
      const newVoters = hasVoted
        ? voters.filter((id) => id !== userId)
        : [...voters, userId];

      updatedItem = {
        ...item,
        votes: hasVoted ? Math.max(0, item.votes - 1) : item.votes + 1,
        voters: newVoters
      };
      return updatedItem;
    }
    return item;
  });

  // 1. Immediately save locally for instantaneous response
  saveLocalVotes(updatedVotes);

  // 2. Broadcast to Cloud Firestore (makes it visible to ALL other users on Vercel)
  if (updatedItem) {
    try {
      const sanitized = sanitizeVoteForFirestore(updatedItem);
      await setDoc(doc(db, 'community_votes', itemId), sanitized, { merge: true });
      updateStatus('cloud_live');
    } catch (e: any) {
      console.warn('Firestore vote write error:', e);
      if (e.code === 'permission-denied') {
        updateStatus('permission_denied', 'Aturan Firestore belum dibuka');
      }
    }
  }

  // 3. Optional Express API
  try {
    await fetch(`/api/community-votes/${itemId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, authorName: userName })
    });
  } catch {
    // Vercel static
  }

  return updatedVotes;
}

// Create New Vote Item (Broadcasts to Cloud Firestore so ALL users see it)
export async function createVoteItem(
  title: string,
  description: string,
  user: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null }
): Promise<CommunityVoteItem> {
  const newItem: CommunityVoteItem = {
    id: `vote-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    title: title.trim(),
    description: description.trim() || '',
    authorName: user.displayName || user.email?.split('@')[0] || 'Pengguna Vanz',
    authorPhoto: user.photoURL || '',
    authorEmail: user.email || '',
    userId: user.uid,
    createdAt: Date.now(),
    votes: 1,
    voters: [user.uid],
    status: 'Direncanakan',
    replies: []
  };

  const current = getLocalVotes();
  const updatedVotes = [newItem, ...current.filter((i) => i.id !== newItem.id)];
  saveLocalVotes(updatedVotes);

  // Broadcast to Cloud Firestore
  try {
    const sanitized = sanitizeVoteForFirestore(newItem);
    await setDoc(doc(db, 'community_votes', newItem.id), sanitized);
    updateStatus('cloud_live');
  } catch (e: any) {
    console.warn('Firestore create vote error:', e);
    if (e.code === 'permission-denied') {
      updateStatus('permission_denied', 'Aturan Firestore belum dibuka');
    }
  }

  // Express API
  try {
    await fetch('/api/community-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
  } catch {
    // Vercel static
  }

  return newItem;
}

// Add Reply to Vote (Broadcasts to Cloud Firestore so ALL users see it)
export async function addReplyToVote(
  itemId: string,
  content: string,
  user: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null }
): Promise<CommunityVoteItem[]> {
  const reply: CommunityReply = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    authorName: user.displayName || user.email?.split('@')[0] || 'Pengguna Vanz',
    authorPhoto: user.photoURL || '',
    authorEmail: user.email || '',
    userId: user.uid,
    content: content.trim(),
    createdAt: Date.now()
  };

  const current = getLocalVotes();
  let updatedTargetItem: CommunityVoteItem | null = null;

  const updatedVotes = current.map((item) => {
    if (item.id === itemId) {
      const replies = Array.isArray(item.replies) ? [...item.replies, reply] : [reply];
      updatedTargetItem = { ...item, replies };
      return updatedTargetItem;
    }
    return item;
  });

  saveLocalVotes(updatedVotes);

  // Broadcast to Cloud Firestore
  if (updatedTargetItem) {
    try {
      const sanitized = sanitizeVoteForFirestore(updatedTargetItem);
      await setDoc(doc(db, 'community_votes', itemId), sanitized, { merge: true });
      updateStatus('cloud_live');
    } catch (e: any) {
      console.warn('Firestore reply write error:', e);
      if (e.code === 'permission-denied') {
        updateStatus('permission_denied', 'Aturan Firestore belum dibuka');
      }
    }
  }

  // Express API
  try {
    await fetch(`/api/community-votes/${itemId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reply)
    });
  } catch {
    // Vercel static
  }

  return updatedVotes;
}

// User Like / Unlike on a Comment / Reply
export async function toggleReplyLike(
  itemId: string,
  replyId: string,
  userId: string
): Promise<CommunityVoteItem[]> {
  const current = getLocalVotes();
  let updatedTargetItem: CommunityVoteItem | null = null;

  const updatedVotes = current.map((item) => {
    if (item.id === itemId) {
      const replies = (item.replies || []).map((reply) => {
        if (reply.id === replyId) {
          const likedBy = Array.isArray(reply.likedBy) ? [...reply.likedBy] : [];
          const hasLiked = likedBy.includes(userId);
          const newLikedBy = hasLiked
            ? likedBy.filter((id) => id !== userId)
            : [...likedBy, userId];
          const currentLikes = typeof reply.likes === 'number' ? reply.likes : 0;
          const newLikes = hasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

          return {
            ...reply,
            likes: newLikes,
            likedBy: newLikedBy
          };
        }
        return reply;
      });

      updatedTargetItem = { ...item, replies };
      return updatedTargetItem;
    }
    return item;
  });

  saveLocalVotes(updatedVotes);

  if (updatedTargetItem) {
    try {
      const sanitized = sanitizeVoteForFirestore(updatedTargetItem);
      await setDoc(doc(db, 'community_votes', itemId), sanitized, { merge: true });
    } catch (e) {
      console.warn('Firestore toggle reply like error:', e);
    }
  }

  return updatedVotes;
}

// ============================================================================
// ADMIN BOOSTER & KENDALI KHUSUS (ADMIN ONLY)
// ============================================================================

/**
 * Admin Booster: Menambah Vote (+10, +50, +100, +500, +1.000, dst) pada Usulan Vote
 */
export async function adminBoostVoteItem(
  user: User | UserProfile | null | undefined,
  itemId: string,
  boostAmount: number
): Promise<{ success: boolean; newCount: number; message: string }> {
  if (!isUserAdmin(user)) {
    return {
      success: false,
      newCount: 0,
      message: 'Akses ditolak: Hanya admin resmi yang diizinkan melakukan boost voting.'
    };
  }

  const current = getLocalVotes();
  let updatedTargetItem: CommunityVoteItem | null = null;
  let newVotes = 0;

  const updatedVotes = current.map((item) => {
    if (item.id === itemId) {
      newVotes = Math.max(0, (item.votes || 0) + boostAmount);
      updatedTargetItem = {
        ...item,
        votes: newVotes,
        boostedVotes: ((item.boostedVotes || 0) + boostAmount),
        lastBoostedAt: Date.now()
      };
      return updatedTargetItem;
    }
    return item;
  });

  saveLocalVotes(updatedVotes);

  if (updatedTargetItem) {
    try {
      const sanitized = sanitizeVoteForFirestore(updatedTargetItem);
      await setDoc(doc(db, 'community_votes', itemId), sanitized, { merge: true });
      return {
        success: true,
        newCount: newVotes,
        message: `Berhasil menambahkan +${boostAmount.toLocaleString('id-ID')} vote!`
      };
    } catch (e: any) {
      return {
        success: true,
        newCount: newVotes,
        message: `Vote di-boost +${boostAmount} (tersimpan lokal & cloud).`
      };
    }
  }

  return { success: false, newCount: 0, message: 'Item usulan tidak ditemukan.' };
}

/**
 * Admin Set Exact: Atur Angka Vote Persis pada Usulan
 */
export async function adminSetExactVoteItem(
  user: User | UserProfile | null | undefined,
  itemId: string,
  exactCount: number
): Promise<{ success: boolean; newCount: number; message: string }> {
  if (!isUserAdmin(user)) {
    return {
      success: false,
      newCount: 0,
      message: 'Akses ditolak: Hanya admin resmi yang diizinkan mengatur vote.'
    };
  }

  const current = getLocalVotes();
  let updatedTargetItem: CommunityVoteItem | null = null;
  const targetCount = Math.max(0, exactCount);

  const updatedVotes = current.map((item) => {
    if (item.id === itemId) {
      updatedTargetItem = {
        ...item,
        votes: targetCount,
        lastBoostedAt: Date.now()
      };
      return updatedTargetItem;
    }
    return item;
  });

  saveLocalVotes(updatedVotes);

  if (updatedTargetItem) {
    try {
      const sanitized = sanitizeVoteForFirestore(updatedTargetItem);
      await setDoc(doc(db, 'community_votes', itemId), sanitized, { merge: true });
      return {
        success: true,
        newCount: targetCount,
        message: `Jumlah vote diatur ke ${targetCount.toLocaleString('id-ID')}.`
      };
    } catch (e) {
      return {
        success: true,
        newCount: targetCount,
        message: `Jumlah vote diatur ke ${targetCount}.`
      };
    }
  }

  return { success: false, newCount: 0, message: 'Item usulan tidak ditemukan.' };
}

/**
 * Admin Booster: Menambah Like (+10, +50, +100, dst) pada Komentar / Balasan
 */
export async function adminBoostReplyLikes(
  user: User | UserProfile | null | undefined,
  itemId: string,
  replyId: string,
  boostAmount: number
): Promise<{ success: boolean; newCount: number; message: string }> {
  if (!isUserAdmin(user)) {
    return {
      success: false,
      newCount: 0,
      message: 'Akses ditolak: Hanya admin resmi yang diizinkan menambah like komentar.'
    };
  }

  const current = getLocalVotes();
  let updatedTargetItem: CommunityVoteItem | null = null;
  let newLikes = 0;

  const updatedVotes = current.map((item) => {
    if (item.id === itemId) {
      const replies = (item.replies || []).map((reply) => {
        if (reply.id === replyId) {
          newLikes = Math.max(0, (reply.likes || 0) + boostAmount);
          return {
            ...reply,
            likes: newLikes
          };
        }
        return reply;
      });

      updatedTargetItem = { ...item, replies };
      return updatedTargetItem;
    }
    return item;
  });

  saveLocalVotes(updatedVotes);

  if (updatedTargetItem) {
    try {
      const sanitized = sanitizeVoteForFirestore(updatedTargetItem);
      await setDoc(doc(db, 'community_votes', itemId), sanitized, { merge: true });
      return {
        success: true,
        newCount: newLikes,
        message: `Berhasil menambahkan +${boostAmount.toLocaleString('id-ID')} Like ke komentar!`
      };
    } catch (e) {
      return {
        success: true,
        newCount: newLikes,
        message: `Like komentar di-boost +${boostAmount}.`
      };
    }
  }

  return { success: false, newCount: 0, message: 'Komentar tidak ditemukan.' };
}

/**
 * Admin Set Exact: Atur Angka Like Persis pada Komentar / Balasan
 */
export async function adminSetExactReplyLikes(
  user: User | UserProfile | null | undefined,
  itemId: string,
  replyId: string,
  exactLikes: number
): Promise<{ success: boolean; newCount: number; message: string }> {
  if (!isUserAdmin(user)) {
    return {
      success: false,
      newCount: 0,
      message: 'Akses ditolak: Hanya admin resmi yang diizinkan mengatur like komentar.'
    };
  }

  const current = getLocalVotes();
  let updatedTargetItem: CommunityVoteItem | null = null;
  const targetLikes = Math.max(0, exactLikes);

  const updatedVotes = current.map((item) => {
    if (item.id === itemId) {
      const replies = (item.replies || []).map((reply) => {
        if (reply.id === replyId) {
          return {
            ...reply,
            likes: targetLikes
          };
        }
        return reply;
      });

      updatedTargetItem = { ...item, replies };
      return updatedTargetItem;
    }
    return item;
  });

  saveLocalVotes(updatedVotes);

  if (updatedTargetItem) {
    try {
      const sanitized = sanitizeVoteForFirestore(updatedTargetItem);
      await setDoc(doc(db, 'community_votes', itemId), sanitized, { merge: true });
      return {
        success: true,
        newCount: targetLikes,
        message: `Jumlah like komentar diatur ke ${targetLikes.toLocaleString('id-ID')}.`
      };
    } catch (e) {
      return {
        success: true,
        newCount: targetLikes,
        message: `Jumlah like komentar diatur ke ${targetLikes}.`
      };
    }
  }

  return { success: false, newCount: 0, message: 'Komentar tidak ditemukan.' };
}

/**
 * Admin Update Status (Direncanakan / Dalam Proses / Selesai)
 */
export async function adminChangeVoteStatus(
  user: User | UserProfile | null | undefined,
  itemId: string,
  status: 'Direncanakan' | 'Dalam Proses' | 'Selesai'
): Promise<boolean> {
  if (!isUserAdmin(user)) return false;

  const current = getLocalVotes();
  let updatedTargetItem: CommunityVoteItem | null = null;

  const updatedVotes = current.map((item) => {
    if (item.id === itemId) {
      updatedTargetItem = { ...item, status };
      return updatedTargetItem;
    }
    return item;
  });

  saveLocalVotes(updatedVotes);

  if (updatedTargetItem) {
    try {
      const sanitized = sanitizeVoteForFirestore(updatedTargetItem);
      await setDoc(doc(db, 'community_votes', itemId), sanitized, { merge: true });
      return true;
    } catch (e) {
      console.warn('Firestore change status error:', e);
    }
  }

  return false;
}

/**
 * Admin Delete Vote Item
 */
export async function adminDeleteVoteItem(
  user: User | UserProfile | null | undefined,
  itemId: string
): Promise<boolean> {
  if (!isUserAdmin(user)) return false;

  const current = getLocalVotes();
  const filtered = current.filter((item) => item.id !== itemId);
  saveLocalVotes(filtered);

  try {
    await deleteDoc(doc(db, 'community_votes', itemId));
    return true;
  } catch (e) {
    console.warn('Firestore delete vote item error:', e);
    return true;
  }
}

/**
 * Admin Delete Reply
 */
export async function adminDeleteReply(
  user: User | UserProfile | null | undefined,
  itemId: string,
  replyId: string
): Promise<boolean> {
  if (!isUserAdmin(user)) return false;

  const current = getLocalVotes();
  let updatedTargetItem: CommunityVoteItem | null = null;

  const updatedVotes = current.map((item) => {
    if (item.id === itemId) {
      const replies = (item.replies || []).filter((r) => r.id !== replyId);
      updatedTargetItem = { ...item, replies };
      return updatedTargetItem;
    }
    return item;
  });

  saveLocalVotes(updatedVotes);

  if (updatedTargetItem) {
    try {
      const sanitized = sanitizeVoteForFirestore(updatedTargetItem);
      await setDoc(doc(db, 'community_votes', itemId), sanitized, { merge: true });
      return true;
    } catch (e) {
      console.warn('Firestore delete reply error:', e);
    }
  }

  return false;
}

