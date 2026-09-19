import { AdminMessage } from '../types';

export const ADMIN_EMAIL = 'revan.seleb.ini0@gmail.com';

export function isUserAdmin(email?: string | null): boolean {
  return true;
}

const STORAGE_KEY = 'vanz_admin_messages_v1';

const DEFAULT_MESSAGES: AdminMessage[] = [
  {
    id: 'msg-default-1',
    title: 'Pembaruan Fitur Tema Dinamis Lagu',
    content: 'Sekarang seluruh tampilan aplikasi (tombol putar, navigasi, bar progres, hingga efek cahaya latar) otomatis beradaptasi dengan warna dominan artwork lagu yang sedang diputar. Nikmati pengalaman mendengarkan musik yang lebih imersif dan berwarna!',
    tag: 'Fitur Baru',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    authorName: 'Admin',
    authorEmail: ADMIN_EMAIL
  },
  {
    id: 'msg-default-2',
    title: 'Musik Tetap Berjalan di Latar Belakang & Layar Kunci',
    content: 'Pembaruan terbaru memungkinkan Anda mendengarkan musik tanpa jeda saat mengunci layar ponsel atau berpindah ke aplikasi lain. Kendalikan pemutaran langsung dari Lock Screen ponsel Anda melalui kontrol MediaSession terintegrasi.',
    tag: 'Update',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    authorName: 'Admin',
    authorEmail: ADMIN_EMAIL
  },
  {
    id: 'msg-default-3',
    title: 'Selamat Datang di Kotak Pesan & Update Resmi',
    content: 'Halaman ini merupakan saluran resmi tempat admin membagikan informasi pembaruan sistem, daftar lagu rekomendasi baru, fitur mendatang, dan pengumuman penting seputar aplikasi. Nantikan kabar menarik selanjutnya!',
    tag: 'Pengumuman',
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    authorName: 'Admin',
    authorEmail: ADMIN_EMAIL
  }
];

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
    const res = await fetch('/api/messages');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        saveLocalMessages(data);
        return data;
      }
    }
  } catch (err) {
    console.info('API offline, falling back to local storage:', err);
  }
  return getLocalMessages();
}

export async function postAdminMessage(
  data: Omit<AdminMessage, 'id' | 'createdAt'>
): Promise<AdminMessage> {
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const newMsg = await res.json();
      const current = getLocalMessages();
      const updated = [newMsg, ...current.filter(m => m.id !== newMsg.id)];
      saveLocalMessages(updated);
      return newMsg;
    }
  } catch (err) {
    console.warn('API post failed, saving locally:', err);
  }

  // Fallback local save if API fails
  const newMsg: AdminMessage = {
    ...data,
    id: `msg-${Date.now()}`,
    createdAt: Date.now()
  };
  const current = getLocalMessages();
  const updated = [newMsg, ...current];
  saveLocalMessages(updated);
  return newMsg;
}

export async function deleteAdminMessage(messageId: string): Promise<void> {
  try {
    await fetch(`/api/messages/${messageId}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('API delete failed:', err);
  }

  const current = getLocalMessages();
  const filtered = current.filter(m => m.id !== messageId);
  saveLocalMessages(filtered);
}
