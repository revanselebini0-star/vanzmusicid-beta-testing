import { LyricLine, Track } from '../types';

export const BACKEND_URL = 'https://server-kappa-black-72.vercel.app';

interface VercelTrack {
  id: string;
  judul?: string;
  title?: string;
  artis?: string;
  artist?: string;
  album?: string;
  coverArt?: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  duration?: string;
  durationSeconds?: number;
  viewCount?: string;
}

const mapVercelToTrack = (v: VercelTrack): Track => ({
  id: v.id || Math.random().toString(36).substring(2, 9),
  title: v.judul || v.title || 'Unknown Title',
  artist: v.artis || v.artist || 'Unknown Artist',
  albumName: v.album || 'Single',
  thumbnail: v.coverArt || v.thumbnailUrl || v.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
  duration: v.duration || "3:30",
  durationSeconds: v.durationSeconds || 210,
  viewCount: v.viewCount || "Populer",
  channelTitle: v.artis || v.artist || 'Official Artist',
  source: 'youtube'
});

export async function searchSongs(query: string): Promise<Track[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  // 1. Primary: User's Backend Server via internal proxy (/api/proxy/search)
  try {
    const res = await fetch(`/api/proxy/search?q=${encodeURIComponent(cleanQ)}`);
    if (res.ok) {
      const data: VercelTrack[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapVercelToTrack);
      }
    }
  } catch (err) {
    console.warn('Proxy search to user server note:', err);
  }

  // 2. Direct fetch to User's Backend Server (https://server-kappa-black-72.vercel.app)
  try {
    const response = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(cleanQ)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      const data: VercelTrack[] = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapVercelToTrack);
      }
    }
  } catch (err) {
    console.warn('Direct user backend search note:', err);
  }

  // 3. Fallback to curated tracks if offline
  const qLower = cleanQ.toLowerCase();
  const matched = FALLBACK_TRENDING_TRACKS.filter(t => 
    t.title.toLowerCase().includes(qLower) || 
    t.artist.toLowerCase().includes(qLower)
  );

  return matched;
}

// Aliases for compatibility
export const searchYouTubeMusic = searchSongs;
export const cariLagu = searchSongs;

export async function getAudioStreamUrl(videoId: string): Promise<string | null> {
  if (!videoId) return null;

  // 1. Try direct Vercel stream API
  try {
    const response = await fetch(`${BACKEND_URL}/api/stream?id=${videoId}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.urlAudioMurni) {
        return data.urlAudioMurni;
      }
    }
  } catch (err) {
    console.warn('Direct stream fetch failed, trying proxy...', err);
  }

  // 2. Try proxy stream API
  try {
    const proxyRes = await fetch(`/api/proxy/stream?id=${videoId}`);
    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      if (proxyData && proxyData.urlAudioMurni) {
        return proxyData.urlAudioMurni;
      }
    }
  } catch (proxyErr) {
    console.warn('Proxy stream failed, using fallback audio...', proxyErr);
  }

  // 3. Fallback working sample audio stream
  return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
}

export const getStreamUrl = getAudioStreamUrl;
export const putarLagu = getAudioStreamUrl;

export async function getHomeSongs(): Promise<Track[]> {
  try {
    const res = await searchSongs("trending music indonesia");
    if (res.length > 0) return res;
  } catch {}
  return [VANZ_ORIGINAL_TRACK];
}

export async function getTrendingSongs(): Promise<Track[]> {
  try {
    const res = await searchSongs("popular hits 2026");
    if (res.length > 0) return res;
  } catch {}
  return [VANZ_ORIGINAL_TRACK];
}

export async function getRecommendedSongs(): Promise<Track[]> {
  try {
    const res = await searchSongs("viral pop hits");
    if (res.length > 0) return res;
  } catch {}
  return [VANZ_ORIGINAL_TRACK];
}

export async function getHomeSection(_region?: string): Promise<Track[]> {
  return getHomeSongs();
}

export async function getTrendingMusic(_region?: string): Promise<Track[]> {
  return getTrendingSongs();
}

export function getVanzTeamTracks(): Track[] {
  return [VANZ_ORIGINAL_TRACK];
}

export function formatViews(viewCount?: string | number): string {
  if (!viewCount) return '0 views';
  if (typeof viewCount === 'string') return viewCount;
  if (viewCount > 1000000) return `${(viewCount / 1000000).toFixed(1)}M views`;
  if (viewCount > 1000) return `${(viewCount / 1000).toFixed(1)}K views`;
  return `${viewCount} views`;
}

export const VANZ_ORIGINAL_TRACK: Track = {
  id: "vanz_langkah_di_tanah_tua",
  title: "Langkah Di Tanah Tua",
  artist: "Vanz Team Music",
  channelTitle: "Vanz Team Music Official",
  thumbnail: "https://res.cloudinary.com/a5qq7uhw/image/upload/v1790588622/Langkah_Akhir.png",
  duration: "3:35",
  durationSeconds: 215,
  viewCount: "Populer • Pilihan Editor",
  albumName: "Langkah Akhir",
  source: "vanz"
};

export const FALLBACK_TRENDING_TRACKS: Track[] = [
  VANZ_ORIGINAL_TRACK,
  {
    id: "bernadya_satu_bulan",
    title: "Satu Bulan",
    artist: "Bernadya",
    channelTitle: "JUNI Records",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80",
    duration: "3:18",
    durationSeconds: 198,
    viewCount: "75M views • Top 1 Viral",
    albumName: "Sialnya, Hidup Harus Tetap Berjalan",
    source: "youtube"
  },
  {
    id: "sal_priadi_dari_planet_lain",
    title: "Gala bunga matahari",
    artist: "Sal Priadi",
    channelTitle: "Sal Priadi Official",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80",
    duration: "3:42",
    durationSeconds: 222,
    viewCount: "68M views • Trending Pop",
    albumName: "MARKERS AND SUCH PENS FLASHDISKS",
    source: "youtube"
  },
  {
    id: "nadhif_bergema",
    title: "bergema sampai selamanya",
    artist: "Nadhif Basalamah",
    channelTitle: "Nadhif Basalamah",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80",
    duration: "3:30",
    durationSeconds: 210,
    viewCount: "42M views • Hits Akustik",
    albumName: "bergema sampai selamanya",
    source: "youtube"
  },
  {
    id: "anggi_marito_tak_segampang_itu",
    title: "Tak Segampang Itu",
    artist: "Anggi Marito",
    channelTitle: "Universal Music Indonesia",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80",
    duration: "3:52",
    durationSeconds: 232,
    viewCount: "120M views • Terfavorit",
    albumName: "Tak Segampang Itu - Single",
    source: "youtube"
  },
  {
    id: "mahalini_sial",
    title: "Sial",
    artist: "Mahalini",
    channelTitle: "HITS Records",
    thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&q=80",
    duration: "4:03",
    durationSeconds: 243,
    viewCount: "145M views • Populer",
    albumName: "Fábula",
    source: "youtube"
  },
  {
    id: "lady_gaga_bruno_die_with_smile",
    title: "Die With A Smile",
    artist: "Lady Gaga & Bruno Mars",
    channelTitle: "Lady Gaga Official",
    thumbnail: "https://images.unsplash.com/photo-1445985543469-433ecba62999?w=300&q=80",
    duration: "4:11",
    durationSeconds: 251,
    viewCount: "350M views • Billboard No. 1",
    albumName: "Die With A Smile",
    source: "youtube"
  },
  {
    id: "billie_eilish_birds_of_a_feather",
    title: "BIRDS OF A FEATHER",
    artist: "Billie Eilish",
    channelTitle: "Billie Eilish",
    thumbnail: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&q=80",
    duration: "3:30",
    durationSeconds: 210,
    viewCount: "280M views • Global Hit",
    albumName: "HIT ME HARD AND SOFT",
    source: "youtube"
  },
  {
    id: "nadin_rayuan_perempuan_gila",
    title: "Rayuan Perempuan Gila",
    artist: "Nadin Amizah",
    channelTitle: "Nadin Amizah Official",
    thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80",
    duration: "3:40",
    durationSeconds: 220,
    viewCount: "54M views • Indie Viral",
    albumName: "Untuk Dunia, Cinta, dan Kotornya",
    source: "youtube"
  },
  {
    id: "juicy_luicy_lampu_kuning",
    title: "Lampu Kuning",
    artist: "Juicy Luicy",
    channelTitle: "Emotion Entertainment",
    thumbnail: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&q=80",
    duration: "3:24",
    durationSeconds: 204,
    viewCount: "39M views • Populer",
    albumName: "Nonfiksi",
    source: "youtube"
  },
  {
    id: "hindia_evaluasi",
    title: "Evaluasi",
    artist: "Hindia",
    channelTitle: "Sun Eater",
    thumbnail: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&q=80",
    duration: "3:45",
    durationSeconds: 225,
    viewCount: "90M views • Indie Populer",
    albumName: "Menari Dengan Bayangan",
    source: "youtube"
  },
  {
    id: "ed_sheeran_shape_of_you",
    title: "Shape of You",
    artist: "Ed Sheeran",
    channelTitle: "Ed Sheeran",
    thumbnail: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&q=80",
    duration: "3:53",
    durationSeconds: 233,
    viewCount: "6B views • Evergreen Hit",
    albumName: "÷ (Divide)",
    source: "youtube"
  },
  {
    id: "queen_bohemian_rhapsody",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    channelTitle: "Queen Official",
    thumbnail: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=300&q=80",
    duration: "5:55",
    durationSeconds: 355,
    viewCount: "1.7B views • Legendary",
    albumName: "A Night at the Opera",
    source: "youtube"
  }
];
export const VIRAL_RECOMMENDED_TRACKS: Track[] = FALLBACK_TRENDING_TRACKS.slice(1, 7);
export const INDONESIAN_TOP_TRACKS: Track[] = FALLBACK_TRENDING_TRACKS.filter(t => t.artist !== 'Ed Sheeran' && t.artist !== 'Queen' && t.artist !== 'Billie Eilish' && t.artist !== 'Lady Gaga & Bruno Mars');
export const GLOBAL_TOP_TRACKS: Track[] = FALLBACK_TRENDING_TRACKS.filter(t => t.artist === 'Lady Gaga & Bruno Mars' || t.artist === 'Billie Eilish' || t.artist === 'Ed Sheeran' || t.artist === 'Queen');
export const NOSTALGIA_INDONESIAN_TRACKS: Track[] = [];

export function parseLRC(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];
  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2}(?:\.\d+)?)\](.*)/);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseFloat(match[2]);
      const text = match[3].trim();
      if (text) result.push({ time: mins * 60 + secs, text: text });
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

export async function getTrackLyrics(title: string, artist: string, duration = 210): Promise<LyricLine[]> {
  try {
    const { fetchRealTrackLyrics } = await import('./lyricsService');
    const res = await fetchRealTrackLyrics(title, artist, undefined, duration);
    return res.lyrics || [];
  } catch {
    return [];
  }
}
