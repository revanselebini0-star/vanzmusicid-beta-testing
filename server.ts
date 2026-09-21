import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const DATA_DIR = path.join(process.cwd(), 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const VOTES_FILE = path.join(DATA_DIR, 'community_votes.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_VOTES = [
  {
    id: 'vote-1',
    title: 'Navigasi Dark Liquid Glass & Auto-Hide Bar',
    description: 'Navbar bawah bergaya kaca transparan hitam dengan responsivitas cerdas saat scroll.',
    authorName: 'Admin Vanz',
    authorPhoto: 'https://cdn.phototourl.com/free/2026-09-19-571b25e0-aa49-47c1-9fa7-8f7127a2a4cd.png',
    authorEmail: 'revan.seleb.ini0@gmail.com',
    userId: 'admin-vanz',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
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
        createdAt: Date.now() - 1000 * 60 * 60 * 12
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
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
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
        createdAt: Date.now() - 1000 * 60 * 60 * 24
      }
    ]
  }
];

function readVotes() {
  try {
    if (fs.existsSync(VOTES_FILE)) {
      const data = fs.readFileSync(VOTES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading votes file:', e);
  }
  return DEFAULT_VOTES;
}

function writeVotes(votes: any[]) {
  try {
    fs.writeFileSync(VOTES_FILE, JSON.stringify(votes, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing votes file:', e);
  }
}

if (!fs.existsSync(VOTES_FILE)) {
  writeVotes(DEFAULT_VOTES);
}

const DEFAULT_MESSAGES = [
  {
    id: 'msg-default-1',
    title: 'Pembaruan Fitur Tema Dinamis Lagu',
    content: 'Sekarang seluruh tampilan aplikasi (tombol putar, navigasi, bar progres, hingga efek cahaya latar) otomatis beradaptasi dengan warna dominan artwork lagu yang sedang diputar. Nikmati pengalaman mendengarkan musik yang lebih imersif dan berwarna!',
    tag: 'Fitur Baru',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    authorName: 'Admin',
    authorEmail: 'revan.seleb.ini0@gmail.com'
  },
  {
    id: 'msg-default-2',
    title: 'Musik Tetap Berjalan di Latar Belakang & Layar Kunci',
    content: 'Pembaruan terbaru memungkinkan Anda mendengarkan musik tanpa jeda saat mengunci layar ponsel atau berpindah ke aplikasi lain. Kendalikan pemutaran langsung dari Lock Screen ponsel Anda melalui kontrol MediaSession terintegrasi.',
    tag: 'Update',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    authorName: 'Admin',
    authorEmail: 'revan.seleb.ini0@gmail.com'
  },
  {
    id: 'msg-default-3',
    title: 'Selamat Datang di Kotak Pesan & Update Resmi',
    content: 'Halaman ini merupakan saluran resmi tempat admin membagikan informasi pembaruan sistem, daftar lagu rekomendasi baru, fitur mendatang, dan pengumuman penting seputar aplikasi. Nantikan kabar menarik selanjutnya!',
    tag: 'Pengumuman',
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    authorName: 'Admin',
    authorEmail: 'revan.seleb.ini0@gmail.com'
  }
];

function readMessages() {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading messages file:', e);
  }
  return DEFAULT_MESSAGES;
}

function writeMessages(messages: any[]) {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing messages file:', e);
  }
}

// Ensure initial file exists
if (!fs.existsSync(MESSAGES_FILE)) {
  writeMessages(DEFAULT_MESSAGES);
}

// API Routes
app.get('/api/messages', (req, res) => {
  const messages = readMessages();
  res.json(messages);
});

app.post('/api/messages', (req, res) => {
  const { title, content, tag, imageUrl, authorName, authorEmail } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const messages = readMessages();
  const newMsg = {
    id: `msg-${Date.now()}`,
    title: title.trim(),
    content: content.trim(),
    tag: tag || 'Update',
    imageUrl: imageUrl || '',
    createdAt: Date.now(),
    authorName: authorName || 'Admin',
    authorEmail: authorEmail || 'revan.seleb.ini0@gmail.com'
  };

  const updated = [newMsg, ...messages];
  writeMessages(updated);
  res.status(201).json(newMsg);
});

app.delete('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  const messages = readMessages();
  const filtered = messages.filter((m: any) => m.id !== id);
  writeMessages(filtered);
  res.json({ success: true });
});

// Community Votes API Routes
app.get('/api/community-votes', (req, res) => {
  const votes = readVotes();
  res.json(votes);
});

app.post('/api/community-votes', (req, res) => {
  const { title, description, authorName, authorPhoto, authorEmail, userId } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Judul vote/fitur harus diisi' });
  }
  if (!userId) {
    return res.status(401).json({ error: 'Harus login terlebih dahulu untuk mengirim usulan vote' });
  }

  const votes = readVotes();
  const newVote = {
    id: `vote-${Date.now()}`,
    title: title.trim(),
    description: description ? description.trim() : '',
    authorName: authorName || 'Pengguna Vanz',
    authorPhoto: authorPhoto || '',
    authorEmail: authorEmail || '',
    userId,
    createdAt: Date.now(),
    votes: 1,
    voters: [userId],
    status: 'Direncanakan',
    replies: []
  };

  const updated = [newVote, ...votes];
  writeVotes(updated);
  res.status(201).json(newVote);
});

app.post('/api/community-votes/:id/vote', (req, res) => {
  const { id } = req.params;
  const { userId, authorName } = req.body;
  if (!userId) {
    return res.status(401).json({ error: 'Harus login akun untuk memberikan vote' });
  }

  const votes = readVotes();
  const targetIndex = votes.findIndex((v: any) => v.id === id);
  if (targetIndex === -1) {
    return res.status(404).json({ error: 'Item vote tidak ditemukan' });
  }

  const item = { ...votes[targetIndex] };
  item.voters = Array.isArray(item.voters) ? [...item.voters] : [];

  const voterIndex = item.voters.indexOf(userId);
  if (voterIndex > -1) {
    // Unvote
    item.voters.splice(voterIndex, 1);
    item.votes = Math.max(0, item.votes - 1);
  } else {
    // Upvote
    item.voters.push(userId);
    item.votes = (item.votes || 0) + 1;
  }

  votes[targetIndex] = item;
  writeVotes(votes);
  res.json(item);
});

app.post('/api/community-votes/:id/replies', (req, res) => {
  const { id } = req.params;
  const { content, authorName, authorPhoto, authorEmail, userId } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Pesan balasan komentar tidak boleh kosong' });
  }
  if (!userId) {
    return res.status(401).json({ error: 'Harus login akun untuk membalas komentar' });
  }

  const votes = readVotes();
  const targetIndex = votes.findIndex((v: any) => v.id === id);
  if (targetIndex === -1) {
    return res.status(404).json({ error: 'Item vote tidak ditemukan' });
  }

  const item = { ...votes[targetIndex] };
  item.replies = Array.isArray(item.replies) ? [...item.replies] : [];

  const newReply = {
    id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    authorName: authorName || 'Pengguna Vanz',
    authorPhoto: authorPhoto || '',
    authorEmail: authorEmail || '',
    userId,
    content: content.trim(),
    createdAt: Date.now()
  };

  item.replies.push(newReply);
  votes[targetIndex] = item;
  writeVotes(votes);
  res.status(201).json(item);
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents,
      config: {
        systemInstruction: 'Anda adalah Asisten Musik, asisten musik dan chatbot pribadi yang ramah, hangat, dan asyik di aplikasi ini. Tugas Anda adalah membantu pengguna mencari rekomendasi lagu terbaik, mendiskusikan musik, lirik, atau sekadar teman cerita dan curhat yang menyenangkan. Gunakan bahasa Indonesia yang santai, ramah, ekspresif, dan berikan saran judul lagu atau artis yang spesifik jika diminta rekomendasi.'
      }
    });

    res.json({ reply: response.text || 'Maaf, asisten sedang berpikir sejenak. Coba lagi ya!' });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan pada asisten musik' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
