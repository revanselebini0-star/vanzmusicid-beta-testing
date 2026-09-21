import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  query, 
  orderBy 
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

// Subscribe to votes in real time (tries Firestore -> falls back to Server API / LocalStorage)
export function subscribeCommunityVotes(
  onUpdate: (votes: CommunityVoteItem[]) => void
): () => void {
  let isUnsubscribed = false;
  let unsubscribeFirestore: (() => void) | null = null;

  // 1. First immediately emit local votes so UI is instant and never empty
  onUpdate(getLocalVotes());

  // 2. Try Firestore real-time listener (works on GitHub Pages & static hosting directly)
  try {
    const votesCollection = collection(db, 'community_votes');
    const q = query(votesCollection, orderBy('createdAt', 'desc'));

    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        if (isUnsubscribed) return;
        if (!snapshot.empty) {
          const items: CommunityVoteItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as CommunityVoteItem;
            items.push({
              ...data,
              id: doc.id,
              voters: Array.isArray(data.voters) ? data.voters : [],
              replies: Array.isArray(data.replies) ? data.replies : []
            });
          });
          saveLocalVotes(items);
          onUpdate(items);
        } else {
          // If Firestore collection is empty, seed with DEFAULT_COMMUNITY_VOTES
          seedDefaultVotesToFirestore();
        }
      },
      (error) => {
        // Firestore rules or offline: fallback to Server API polling or local storage
        console.info('Firestore subscription notice (using server API / local cache):', error.message);
        fallbackPollApi(onUpdate);
      }
    );
  } catch (e) {
    console.warn('Firestore initialization failed:', e);
    fallbackPollApi(onUpdate);
  }

  return () => {
    isUnsubscribed = true;
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

// Fallback polling for Express server (if running) or local cache
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
    // Expected on static hosting (GitHub Pages) where /api doesn't exist
  }
  onUpdate(getLocalVotes());
}

// Seed default votes to Firestore if empty
async function seedDefaultVotesToFirestore() {
  try {
    for (const item of DEFAULT_COMMUNITY_VOTES) {
      await setDoc(doc(db, 'community_votes', item.id), item, { merge: true });
    }
  } catch (e) {
    // If permission denied, no problem: local votes are already active
  }
}

// Toggle Upvote / Unvote (Works on GitHub Pages, Cloud Run, Localhost)
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

  // 1. Immediately persist locally (Guarantees vote is never lost on GitHub Pages!)
  saveLocalVotes(updatedVotes);

  // 2. Sync with Firestore (for real-time multi-user synchronization on GitHub Pages)
  if (updatedItem) {
    try {
      const voteRef = doc(db, 'community_votes', itemId);
      await setDoc(voteRef, updatedItem, { merge: true });
    } catch (e) {
      console.info('Firestore sync info (vote saved locally):', e);
    }
  }

  // 3. Also try Express server API if running in full-stack container
  try {
    await fetch(`/api/community-votes/${itemId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, authorName: userName })
    });
  } catch {
    // Static hosting has no server, safe to ignore
  }

  return updatedVotes;
}

// Create New Vote Suggestion (Works on GitHub Pages, Cloud Run, Localhost)
export async function createVoteItem(
  title: string,
  description: string,
  user: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null }
): Promise<CommunityVoteItem> {
  const newItem: CommunityVoteItem = {
    id: `vote-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    title: title.trim(),
    description: description.trim() || undefined,
    authorName: user.displayName || user.email?.split('@')[0] || 'Pengguna Vanz',
    authorPhoto: user.photoURL || undefined,
    authorEmail: user.email || undefined,
    userId: user.uid,
    createdAt: Date.now(),
    votes: 1,
    voters: [user.uid],
    status: 'Direncanakan',
    replies: []
  };

  const current = getLocalVotes();
  const updatedVotes = [newItem, ...current.filter((i) => i.id !== newItem.id)];
  
  // 1. Save locally
  saveLocalVotes(updatedVotes);

  // 2. Sync with Firestore
  try {
    await setDoc(doc(db, 'community_votes', newItem.id), newItem);
  } catch (e) {
    console.info('Firestore sync info (vote suggestion saved locally):', e);
  }

  // 3. Try Express API
  try {
    await fetch('/api/community-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
  } catch {
    // Static hosting
  }

  return newItem;
}

// Add Reply to Vote (Works on GitHub Pages, Cloud Run, Localhost)
export async function addReplyToVote(
  itemId: string,
  content: string,
  user: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null }
): Promise<CommunityVoteItem[]> {
  const reply: CommunityReply = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    authorName: user.displayName || user.email?.split('@')[0] || 'Pengguna Vanz',
    authorPhoto: user.photoURL || undefined,
    authorEmail: user.email || undefined,
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

  // 1. Save locally
  saveLocalVotes(updatedVotes);

  // 2. Sync with Firestore
  if (updatedTargetItem) {
    try {
      await setDoc(doc(db, 'community_votes', itemId), updatedTargetItem, { merge: true });
    } catch (e) {
      console.info('Firestore sync info (reply saved locally):', e);
    }
  }

  // 3. Try Express API
  try {
    await fetch(`/api/community-votes/${itemId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reply)
    });
  } catch {
    // Static hosting
  }

  return updatedVotes;
}
