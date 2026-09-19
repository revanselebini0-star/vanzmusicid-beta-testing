import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { AdminMessage } from '../types';

export const ADMIN_EMAIL = 'revan.seleb.ini0@gmail.com';

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

const STORAGE_KEY = 'vanz_admin_messages_v1';

const DEFAULT_MESSAGES: AdminMessage[] = [
  {
    id: 'msg-default-1',
    title: 'Pembaruan Fitur Tema Dinamis Lagu',
    content: 'Sekarang seluruh tampilan aplikasi (tombol putar, navigasi, bar progres, hingga efek cahaya latar) otomatis beradaptasi dengan warna dominan artwork lagu yang sedang diputar. Nikmati pengalaman mendengarkan musik yang lebih imersif dan berwarna!',
    tag: 'Fitur Baru',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    authorName: 'Admin',
    authorEmail: ADMIN_EMAIL
  },
  {
    id: 'msg-default-2',
    title: 'Musik Tetap Berjalan di Latar Belakang & Layar Kunci',
    content: 'Pembaruan terbaru memungkinkan Anda mendengarkan musik tanpa jeda saat mengunci layar ponsel atau berpindah ke aplikasi lain. Kendalikan pemutaran langsung dari Lock Screen ponsel Anda melalui kontrol MediaSession terintegrasi.',
    tag: 'Update',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    authorName: 'Admin',
    authorEmail: ADMIN_EMAIL
  },
  {
    id: 'msg-default-3',
    title: 'Selamat Datang di Kotak Pesan & Update Resmi',
    content: 'Halaman ini merupakan saluran resmi tempat admin membagikan informasi pembaruan sistem, daftar lagu rekomendasi baru, fitur mendatang, dan pengumuman penting seputar aplikasi. Nantikan kabar menarik selanjutnya!',
    tag: 'Pengumuman',
    createdAt: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
    authorName: 'Admin',
    authorEmail: ADMIN_EMAIL
  }
];

// Load local cache
function getLocalMessages(): AdminMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MESSAGES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_MESSAGES;
  } catch {
    return DEFAULT_MESSAGES;
  }
}

function saveLocalMessages(messages: AdminMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.warn('Failed to save messages to localStorage', e);
  }
}

export async function fetchAdminMessages(): Promise<AdminMessage[]> {
  try {
    const messagesCol = collection(db, 'admin_messages');
    const q = query(messagesCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const items: AdminMessage[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<AdminMessage, 'id'>)
      }));
      saveLocalMessages(items);
      return items;
    }
  } catch (err) {
    console.info('Firestore offline or permission fallback, using local storage messages:', err);
  }

  return getLocalMessages();
}

export async function postAdminMessage(
  data: Omit<AdminMessage, 'id' | 'createdAt'>
): Promise<AdminMessage> {
  const newMsg: AdminMessage = {
    ...data,
    id: `msg-${Date.now()}`,
    createdAt: Date.now()
  };

  // 1. Try to save to Firestore
  try {
    const messagesCol = collection(db, 'admin_messages');
    const docRef = await addDoc(messagesCol, {
      title: newMsg.title,
      content: newMsg.content,
      imageUrl: newMsg.imageUrl || '',
      tag: newMsg.tag || 'Update',
      createdAt: newMsg.createdAt,
      authorName: newMsg.authorName || 'Admin',
      authorEmail: newMsg.authorEmail || ADMIN_EMAIL
    });
    newMsg.id = docRef.id;
  } catch (err) {
    console.warn('Could not post to Firestore directly, saved locally:', err);
  }

  // 2. Save to local storage cache so immediate updates reflect
  const current = getLocalMessages();
  const updated = [newMsg, ...current];
  saveLocalMessages(updated);

  return newMsg;
}

export async function deleteAdminMessage(messageId: string): Promise<void> {
  // 1. Try Firestore
  try {
    const docRef = doc(db, 'admin_messages', messageId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Could not delete from Firestore directly, updating locally:', err);
  }

  // 2. Remove from local storage
  const current = getLocalMessages();
  const filtered = current.filter(m => m.id !== messageId);
  saveLocalMessages(filtered);
}
