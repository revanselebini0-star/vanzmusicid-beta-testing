import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot
} from 'firebase/firestore';

export interface CommunityReply {
  id: string;
  authorName: string;
  authorPhoto?: string;
  authorEmail?: string;
  userId: string;
  content: string;
  createdAt: number;
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

  // 2. Real-time listener from Firestore
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
        console.warn('Firestore subscription status:', error.code, error.message);
        if (isPerm) {
          updateStatus('permission_denied', 'Aturan Firestore belum dibuka di Firebase Console');
        } else {
          updateStatus('local_fallback', error.message);
        }
        fallbackPollApi(onUpdate);
      }
    );
  } catch (e: any) {
    console.warn('Firestore initialization error:', e);
    updateStatus('local_fallback');
    fallbackPollApi(onUpdate);
  }

  return () => {
    isUnsubscribed = true;
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
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
    replies: Array.isArray(item.replies)
      ? item.replies.map((r: any) => ({
          id: r.id || '',
          authorName: r.authorName || 'Pengguna Vanz',
          authorPhoto: r.authorPhoto || '',
          authorEmail: r.authorEmail || '',
          userId: r.userId || 'guest',
          content: r.content || '',
          createdAt: r.createdAt || Date.now()
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
