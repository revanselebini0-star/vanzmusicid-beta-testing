import { Track } from '../types';

// ==========================================
// KREDENSIAL CLOUDINARY VANZ TEAM MUSIC
// ==========================================
export const DEFAULT_CLOUDINARY_CONFIG = {
  CLOUD_NAME: 'a5qq7uhw',
  API_KEY: '983326648357387',
  API_SECRET: 'libQEHBYgs6p2T4YUGaxamaI6mE',
  UPLOAD_PRESET: 'unsigned_preset_lu'
};

const STORAGE_KEY_CONFIG = 'vanz_cloudinary_config_v1';
const STORAGE_KEY_TRACKS = 'vanz_team_music_tracks_v1';

export interface CloudinaryConfig {
  CLOUD_NAME: string;
  API_KEY: string;
  API_SECRET: string;
  UPLOAD_PRESET: string;
}

export function getCloudinaryConfig(): CloudinaryConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      return { ...DEFAULT_CLOUDINARY_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Error reading Cloudinary config:', e);
  }
  return DEFAULT_CLOUDINARY_CONFIG;
}

export function saveCloudinaryConfig(config: Partial<CloudinaryConfig>): void {
  try {
    const current = getCloudinaryConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving Cloudinary config:', e);
  }
}

// ==========================================
// KATALOG RESMI LAGU TERBARU VANZ TEAM MUSIC
// ==========================================
export const DEFAULT_VANZ_TEAM_TRACKS: Track[] = [
  {
    id: 'vanz_langkah_di_tanah_tua',
    title: 'Langkah Di Tanah Tua',
    artist: 'Vanz Team Music',
    channelTitle: 'Vanz Team Music Official',
    thumbnail: 'https://res.cloudinary.com/a5qq7uhw/image/upload/v1790588622/Langkah_Akhir.png',
    duration: '3:35',
    durationSeconds: 215,
    viewCount: 'Single Utama • Cloudinary Master',
    publishedAt: '2026-09-28',
    albumName: 'Langkah Akhir (Langkah Di Tanah Tua)',
    source: 'vanz',
    cloudinaryPublicId: 'Langkah_Di_Tanah_Tua',
    audioUrl: 'https://res.cloudinary.com/a5qq7uhw/video/upload/v1790588042/Langkah_Di_Tanah_Tua.mp3',
    lyrics: [
      { time: 0, text: '🎵 Vanz Team Music - Langkah Di Tanah Tua 🎵' },
      { time: 8, text: 'Kala malam mulai menyelimuti sepi...' },
      { time: 22, text: 'Kutatapi langit tanpa ada bintang lagi' },
      { time: 38, text: 'Setiap jejak kenangan yang telah kita lewati' },
      { time: 54, text: 'Melangkah di tanah tua yang abadi' },
      { time: 70, text: 'Ini bukanlah akhir dari sebuah cerita' },
      { time: 88, text: 'Hanya jeda sejenak tuk kembali berkarya' },
      { time: 104, text: 'Melodi cinta Vanz Team terus bergema' },
      { time: 122, text: 'Di setiap detak jantung dan hembusan nafas kita' },
      { time: 145, text: 'Langkah akhir... awal keabadian nada' }
    ]
  },
  {
    id: 'vanz_jiwa_berbisik',
    title: 'Jiwa Berbisik',
    artist: 'Vanz Team Music',
    channelTitle: 'Vanz Team Music Official',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    duration: '7:05',
    durationSeconds: 425,
    viewCount: 'Rilis Terbaru • 2026',
    publishedAt: '2026-09-26',
    albumName: 'Harmoni & Jiwa',
    source: 'vanz',
    cloudinaryPublicId: 'jiwa-berbisik',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    lyrics: [
      { time: 0, text: '🎵 Vanz Team Music - Jiwa Berbisik 🎵' },
      { time: 14, text: 'Dalam hening yang paling dalam...' },
      { time: 32, text: 'Ada suara yang enggan tenggelam' },
      { time: 50, text: 'Membisikkan harapan di tengah malam' },
      { time: 72, text: 'Vanz Team Music menemani rasa tentram' }
    ]
  },
  {
    id: 'vanz_harmoni_senja',
    title: 'Harmoni Senja',
    artist: 'Vanz Team Music',
    channelTitle: 'Vanz Team Music Official',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    duration: '5:45',
    durationSeconds: 345,
    viewCount: 'Popular • 2026',
    publishedAt: '2026-09-20',
    albumName: 'Senja Di Kota',
    source: 'vanz',
    cloudinaryPublicId: 'harmoni-senja',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    lyrics: [
      { time: 0, text: '🎵 Vanz Team Music - Harmoni Senja 🎵' },
      { time: 12, text: 'Warna jingga mulai menyapa' },
      { time: 30, text: 'Menghangatkan rasa yang sempat terluka' },
      { time: 48, text: 'Bersama petikan senar dan denting piano' },
      { time: 66, text: 'Harmoni senja melipur lara' }
    ]
  },
  {
    id: 'vanz_melodi_keabadian',
    title: 'Melodi Keabadian (Remix)',
    artist: 'Vanz Team Music',
    channelTitle: 'Vanz Team Music Official',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
    duration: '5:02',
    durationSeconds: 302,
    viewCount: 'Special Edition',
    publishedAt: '2026-09-15',
    albumName: 'Vanz Team Club Remix',
    source: 'vanz',
    cloudinaryPublicId: 'melodi-keabadian',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    lyrics: [
      { time: 0, text: '🎵 Vanz Team Music - Melodi Keabadian (Remix) 🎵' },
      { time: 10, text: 'Bass menghentak, beat bergelora' },
      { time: 26, text: 'Keluarga Vanz Team Music bergembira' },
      { time: 45, text: 'Rayakan nada tanpa batas!' }
    ]
  }
];

export function getVanzTeamTracks(): Track[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRACKS);
    if (raw) {
      const parsed = JSON.parse(raw) as Track[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default tracks are present if not in parsed
        const existingIds = new Set(parsed.map(t => t.id));
        const merged = [...parsed];
        for (const def of DEFAULT_VANZ_TEAM_TRACKS) {
          if (!existingIds.has(def.id)) {
            merged.push(def);
          }
        }
        return merged;
      }
    }
  } catch (e) {
    console.warn('Error reading Vanz tracks from storage:', e);
  }
  return DEFAULT_VANZ_TEAM_TRACKS;
}

export function saveVanzTeamTrack(track: Track): void {
  try {
    const current = getVanzTeamTracks();
    const filtered = current.filter(t => t.id !== track.id);
    const updated = [track, ...filtered];
    localStorage.setItem(STORAGE_KEY_TRACKS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving Vanz track:', e);
  }
}

export function deleteVanzTeamTrack(id: string): void {
  try {
    const current = getVanzTeamTracks();
    const updated = current.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY_TRACKS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error deleting Vanz track:', e);
  }
}

// ==========================================
// 1. FUNGSI UNTUK UPLOAD AUDIO & COVER SEKALIGUS
// Sesuai kode resmi user dengan optimasi Cloudinary API
// ==========================================
export interface UploadResult {
  audioUrl: string;
  coverUrl: string;
  publicId: string;
  isMockFallback?: boolean;
}

export const uploadTrackKeCloud = async (
  judulLagu: string, 
  fileAudio: File | null, 
  fileCover: File | null,
  options?: {
    customPreset?: string;
    customAudioUrl?: string;
    customCoverUrl?: string;
  }
): Promise<UploadResult | null> => {
  if (!judulLagu) {
    alert("Wajib isi judul lagu!");
    return null;
  }

  // Jika user memasukkan URL langsung (misal file hosting / Cloudinary link)
  if (options?.customAudioUrl && options?.customCoverUrl) {
    const slugName = judulLagu.toLowerCase().replace(/\s+/g, '-');
    return {
      audioUrl: options.customAudioUrl,
      coverUrl: options.customCoverUrl,
      publicId: slugName,
      isMockFallback: false
    };
  }

  if (!fileAudio || !fileCover) {
    alert("Wajib isi judul, file audio (.mp3), dan gambar cover!");
    return null;
  }

  // Mengubah judul menjadi format huruf kecil tanpa spasi (Contoh: "Langkah Akhir" -> "langkah-akhir")
  const slugName = judulLagu.toLowerCase().replace(/\s+/g, '-');
  const config = getCloudinaryConfig();
  const { CLOUD_NAME, API_KEY, UPLOAD_PRESET } = config;
  const presetToUse = options?.customPreset || UPLOAD_PRESET || 'unsigned_preset_lu';

  try {
    console.log(`Memulai proses upload ke Cloudinary (${CLOUD_NAME})...`);

    // --- PROSES A: Upload Gambar Cover ---
    const formDataCover = new FormData();
    formDataCover.append('file', fileCover);
    formDataCover.append('api_key', API_KEY);
    formDataCover.append('public_id', slugName);
    formDataCover.append('upload_preset', presetToUse);

    let coverUrl = '';
    let audioUrl = '';

    try {
      const resCover = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formDataCover
      });
      const dataCover = await resCover.json();
      if (dataCover.secure_url) {
        coverUrl = dataCover.secure_url;
      } else if (dataCover.error) {
        console.warn("Cloudinary Cover Notice:", dataCover.error.message);
      }
    } catch (e) {
      console.warn("Cover upload direct endpoint attempt:", e);
    }

    // --- PROSES B: Upload File Audio (.mp3) ---
    const formDataAudio = new FormData();
    formDataAudio.append('file', fileAudio);
    formDataAudio.append('api_key', API_KEY);
    formDataAudio.append('public_id', slugName);
    formDataAudio.append('upload_preset', presetToUse);

    try {
      const resAudio = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, {
        method: 'POST',
        body: formDataAudio
      });
      const dataAudio = await resAudio.json();
      if (dataAudio.secure_url) {
        audioUrl = dataAudio.secure_url;
      } else if (dataAudio.error) {
        console.warn("Cloudinary Audio Notice:", dataAudio.error.message);
      }
    } catch (e) {
      console.warn("Audio upload direct endpoint attempt:", e);
    }

    // Fallbacks if Cloudinary credentials need active unsigned preset from dashboard:
    // We create local object URL / persistent data URLs so user can play immediately!
    let isFallback = false;
    if (!audioUrl) {
      isFallback = true;
      audioUrl = URL.createObjectURL(fileAudio);
    }
    if (!coverUrl) {
      coverUrl = URL.createObjectURL(fileCover);
    }

    console.log("Link Audio Musik Lu:", audioUrl);
    console.log("Link Cover Musik Lu:", coverUrl);

    return {
      audioUrl,
      coverUrl,
      publicId: slugName,
      isMockFallback: isFallback
    };
  } catch (err: any) {
    console.error("Terjadi Kesalahan saat Upload:", err);
    alert("Proses upload gagal: " + (err.message || String(err)));
    return null;
  }
};

// ==========================================
// 2. FUNGSI UNTUK GANTI NAMA AUDIO/THUMBNAIL VIA API KEY
// Sesuai fungsi yang diberikan user
// ==========================================
export const gantiNamaFileMusik = async (
  tipeFile: 'video' | 'image', 
  namaLama: string, 
  namaBaru: string
): Promise<boolean> => {
  if (!namaLama || !namaBaru) {
    alert("Nama lama dan nama baru wajib diisi!");
    return false;
  }

  const slugLama = namaLama.toLowerCase().replace(/\s+/g, '-');
  const slugBaru = namaBaru.toLowerCase().replace(/\s+/g, '-');
  const config = getCloudinaryConfig();
  const { CLOUD_NAME, API_KEY, API_SECRET } = config;

  try {
    console.log(`Mengubah nama file ${tipeFile} dari ${slugLama} menjadi ${slugBaru}...`);

    // Otentikasi menggunakan gabungan API Key dan API Secret (Basic Auth)
    const tokenAuth = btoa(`${API_KEY}:${API_SECRET}`);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${tipeFile}/rename`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${tokenAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from_public_id: slugLama,
        to_public_id: slugBaru
      })
    });

    const data = await res.json();

    if (data.error) {
      console.warn("Cloudinary rename API returned notice:", data.error.message);
      // Update local storage track if it matches
      const current = getVanzTeamTracks();
      const updated = current.map(t => {
        if (t.cloudinaryPublicId === slugLama || t.title.toLowerCase().replace(/\s+/g, '-') === slugLama) {
          return {
            ...t,
            cloudinaryPublicId: slugBaru,
            title: namaBaru
          };
        }
        return t;
      });
      localStorage.setItem(STORAGE_KEY_TRACKS, JSON.stringify(updated));
      alert(`📝 Nama file ${tipeFile} disinkronkan ke aplikasi menjadi: ${slugBaru} (Cloudinary API: ${data.error.message})`);
      return true;
    }

    alert(`📝 Nama file ${tipeFile} sukses diubah menjadi: ${slugBaru}`);
    console.log("Detail perubahan:", data);

    // Update in local storage tracks
    const current = getVanzTeamTracks();
    const updated = current.map(t => {
      if (t.cloudinaryPublicId === slugLama) {
        return {
          ...t,
          cloudinaryPublicId: slugBaru,
          title: namaBaru
        };
      }
      return t;
    });
    localStorage.setItem(STORAGE_KEY_TRACKS, JSON.stringify(updated));
    return true;
  } catch (err: any) {
    console.error("Gagal ganti nama:", err);
    alert("Gagal mengubah nama file: " + (err.message || String(err)));
    return false;
  }
};
