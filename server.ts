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

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
