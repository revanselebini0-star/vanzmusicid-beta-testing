import { Track, LyricLine } from '../types';
import { getVanzTeamTracks } from './vanzTeamMusic';

// ========================================================
// APPLE MUSIC API KEY & USER TOKEN (Configured as requested)
// ========================================================
export const APPLE_MUSIC_USER_TOKEN = "0.Av0K6mWqgzpF4QsqpkmAOKV12SzAVeeni/5TeYykuGyLH7TlxL0nWa8SocoyTDkGfTXeqmJcwftazpPhdxSriwNBxX9XbzhS4ONwpEHM1eKHpTpJYeZ2nB0QT0dIolmxgeU7VKVId8IKhaeBk7HMgOWRxJH6mscMnXBFgfLHjrXjOc7KRiq8EnHvye27UB3s3nlcck8qoVHcn7FaaPnvY4QNXJqgIerLHbTOxevkxcpCZQcICA==";
export const APPLE_MUSIC_TOKEN = APPLE_MUSIC_USER_TOKEN;

export const APPLE_MUSIC_DEVELOPER_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6IldlYlBsYXlLaWQifQ.eyJpc3MiOiJBTVBXZWJQbGF5IiwiaWF0IjoxNzg5Njg4NzA5LCJleHAiOjE3OTU3MzY3MDksInJvb3RfaHR0cHNfb3JpZ2luIjpbImFwcGxlLmNvbSJdfQ.y0gd6YWyrUrZx-YZNZS0xVHkDHGr-kGZ9RrsWRfApGc2-_NNC968VsD36hRU33s5BBs4KdB7LIZTmYqPra097Q";

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function upgradeArtworkUrl(url: string, size = 600): string {
  if (!url) return '';
  return url
    .replace(/\/\d+x\d+bb\.(jpg|png)/i, `/${size}x${size}bb.jpg`)
    .replace(/\/100x100bb\.(jpg|png)/i, `/${size}x${size}bb.jpg`)
    .replace(/\/170x170bb\.(jpg|png)/i, `/${size}x${size}bb.jpg`)
    .replace('{w}x{h}', `${size}x${size}`);
}

export function cleanTitle(rawTitle: string): { title: string; artist: string } {
  let cleaned = rawTitle
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\|.*$/g, '')
    .replace(/Official (Music )?Video/gi, '')
    .replace(/Official Audio/gi, '')
    .replace(/Lyric(s)? Video/gi, '')
    .trim();

  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim()
    };
  }

  return {
    title: cleaned || rawTitle,
    artist: "Apple Music Artist"
  };
}

export function formatViews(views?: string | number): string {
  if (!views) return "Apple Music Hit";
  const num = typeof views === 'string' ? parseInt(views, 10) : views;
  if (isNaN(num)) return String(views);
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)} Milyar putaran`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} Juta putaran`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)} Ribu putaran`;
  return `${num} putaran`;
}

// Fallback curated Apple Music top tracks with authentic artwork and lossless audio
export const FALLBACK_APPLE_TRACKS: Track[] = [
  {
    id: "vanz_langkah_di_tanah_tua",
    title: "Langkah Di Tanah Tua",
    artist: "Vanz Team Music",
    channelTitle: "Vanz Team Music Official",
    thumbnail: "https://res.cloudinary.com/a5qq7uhw/image/upload/v1790588622/Langkah_Akhir.png",
    duration: "3:35",
    durationSeconds: 215,
    viewCount: "Populer • Pilihan Editor Apple Music",
    albumName: "Langkah Akhir",
    source: "vanz",
    cloudinaryPublicId: "Langkah_Di_Tanah_Tua",
    audioUrl: "https://res.cloudinary.com/a5qq7uhw/video/upload/v1790588042/Langkah_Di_Tanah_Tua.mp3",
    lyrics: [
      { time: 0, text: "🎵 Vanz Team Music - Langkah Di Tanah Tua 🎵" },
      { time: 8, text: "Kala malam mulai menyelimuti sepi..." },
      { time: 22, text: "Kutatapi langit tanpa ada bintang lagi" },
      { time: 38, text: "Setiap jejak kenangan yang telah kita lewati" },
      { time: 54, text: "Melangkah di tanah tua yang abadi" },
      { time: 70, text: "Ini bukanlah akhir dari sebuah cerita" },
      { time: 88, text: "Hanya jeda sejenak tuk kembali berkarya" },
      { time: 104, text: "Melodi cinta Vanz Team terus bergema" },
      { time: 122, text: "Di setiap detak jantung dan hembusan nafas kita" },
      { time: 145, text: "Langkah akhir... awal keabadian nada" }
    ]
  },
  {
    id: "apple_1767171457",
    title: "Sailor Song",
    artist: "Gigi Perez",
    channelTitle: "Gigi Perez",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/25/d4/96/25d49699-acc0-401f-a7cc-d7697339a474/24UM1IM03751.rgb.jpg/600x600bb.jpg",
    duration: "3:31",
    durationSeconds: 211,
    audioUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/6d/fe/18/6dfe184e-7612-f171-0356-0b7a84112e9a/mzaf_9760607751711758843.plus.aac.p.m4a",
    viewCount: "Apple Music Top 100",
    source: "apple"
  },
  {
    id: "apple_1744111382",
    title: "Kata Mereka Ini Berlebihan",
    artist: "Bernadya",
    channelTitle: "Bernadya - Sialnya, Hidup Harus Tetap Berjalan",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ca/8f/3d/ca8f3d69-cb1f-44aa-aa84-0610f76eb486/198391807498.jpg/600x600bb.jpg",
    duration: "3:18",
    durationSeconds: 198,
    audioUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e5/22/e1/e522e11a-0518-d069-4e7d-cb0973a903c7/mzaf_3990666060155255474.plus.aac.p.m4a",
    viewCount: "Apple Music Indonesia #1",
    source: "apple"
  },
  {
    id: "apple_1714561081",
    title: "Penjaga Hati",
    artist: "Nadhif Basalamah",
    channelTitle: "Nadhif Basalamah",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/f5/63/12/f5631245-cba3-f24f-cf45-091a9f1a26d7/197338573199.jpg/600x600bb.jpg",
    duration: "4:20",
    durationSeconds: 260,
    audioUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/80/7e/15/807e1553-d15f-5ff0-83ae-f94dd383eb6f/mzaf_1002364491953258849.plus.aac.p.m4a",
    viewCount: "Apple Music Top Indonesia",
    source: "apple"
  },
  {
    id: "apple_1752763830",
    title: "Die With A Smile",
    artist: "Lady Gaga & Bruno Mars",
    channelTitle: "Lady Gaga & Bruno Mars",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/74/ad/87/74ad87a8-3a95-7e04-d533-31742eb5957b/24UMGIM81958.rgb.jpg/600x600bb.jpg",
    duration: "4:11",
    durationSeconds: 251,
    audioUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/1b/ad/82/1bad82f6-ae0e-2503-e2e4-9642646271c0/mzaf_6718420601323381665.plus.aac.p.m4a",
    viewCount: "Apple Music Global Top",
    source: "apple"
  },
  {
    id: "apple_1440857781",
    title: "Shape of You",
    artist: "Ed Sheeran",
    channelTitle: "Ed Sheeran - ÷ (Deluxe)",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/05/2d/10/052d1033-9366-be9c-2ee1-5e2fe2786a34/190295851286.jpg/600x600bb.jpg",
    duration: "3:53",
    durationSeconds: 233,
    audioUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/91/d5/ca/91d5ca35-e6f7-c57a-df0c-c69785c962b1/mzaf_13508197127914946639.plus.aac.p.m4a",
    viewCount: "Apple Music Classic Pop",
    source: "apple"
  },
  {
    id: "apple_6810478079",
    title: "Baby Come Home",
    artist: "JOSHUA & WeiBird",
    channelTitle: "JOSHUA & WeiBird",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/5c/3b/47/5c3b4798-b8a0-2086-2c1a-4dcbf882a608/823375420699_Cover.jpg/600x600bb.jpg",
    duration: "3:22",
    durationSeconds: 202,
    audioUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5a/dd/f7/5addf755-fa57-d6bc-9698-a01e9b9288d7/mzaf_14724730920482159484.plus.aac.p.m4a",
    viewCount: "Apple Music Chart",
    source: "apple"
  }
];

export const VIRAL_RECOMMENDED_TRACKS = FALLBACK_APPLE_TRACKS;
export const FALLBACK_TRENDING_TRACKS = FALLBACK_APPLE_TRACKS;

// Helper to construct headers with Apple Music Developer Token and media-user-token
export function getAppleAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json'
  };

  if (APPLE_MUSIC_DEVELOPER_TOKEN) {
    headers['Authorization'] = `Bearer ${APPLE_MUSIC_DEVELOPER_TOKEN}`;
  }

  if (APPLE_MUSIC_USER_TOKEN) {
    headers['media-user-token'] = APPLE_MUSIC_USER_TOKEN;
    headers['Music-User-Token'] = APPLE_MUSIC_USER_TOKEN;
  }

  return headers;
}

// Convert Apple Music API item to Track model
function mapAppleItemToTrack(item: any): Track {
  const attrs = item.attributes || {};
  const durationSec = Math.round((attrs.durationInMillis || 180000) / 1000);
  const artworkUrl = attrs.artwork?.url
    ? attrs.artwork.url.replace('{w}x{h}', '600x600').replace('{w}', '600').replace('{h}', '600')
    : '';
  const previewUrl = attrs.previews?.[0]?.url;
  const traits: string[] = attrs.audioTraits || [];
  const hasAtmos = traits.includes('atmos') || traits.includes('spatial');
  const hasLossless = traits.includes('lossless') || traits.includes('hi-res-lossless');

  return {
    id: `apple_${item.id}`,
    appleSongId: String(item.id),
    title: attrs.name || 'Untitled',
    artist: attrs.artistName || 'Various Artists',
    channelTitle: attrs.albumName || attrs.artistName,
    albumName: attrs.albumName,
    thumbnail: artworkUrl,
    duration: formatDuration(durationSec),
    durationSeconds: durationSec,
    audioUrl: previewUrl,
    viewCount: hasAtmos ? 'Dolby Atmos • Apple DRM' : hasLossless ? 'Lossless DRM • Apple Music' : 'Apple Music DRM',
    source: 'apple',
    isDrmProtected: true,
    audioTraits: traits
  };
}

// Fetch Apple Music Top Charts / Trending
export async function getAppleMusicTrending(storefront = 'id'): Promise<Track[]> {
  const vanz = getVanzTeamTracks()[0] || FALLBACK_APPLE_TRACKS[0];

  // 1. Try internal backend proxy (with full Authorization Bearer & media-user-token, no CORS restrictions)
  try {
    const res = await fetch(`/api/apple-music/charts?storefront=${storefront}&limit=30`);
    if (res.ok) {
      const data = await res.json();
      const songs = data.results?.songs?.[0]?.data || [];
      if (songs.length > 0) {
        const fetchedTracks = songs.map(mapAppleItemToTrack);
        return [vanz, ...fetchedTracks.filter((t: Track) => t.id !== vanz.id)];
      }
    }
  } catch (err) {
    console.warn("Backend Apple Music charts proxy note:", err);
  }

  // 2. Try direct Apple Music API with User Token and Developer Token
  try {
    const res = await fetch(`https://amp-api.music.apple.com/v1/catalog/${storefront}/charts?types=songs&limit=30`, {
      headers: getAppleAuthHeaders()
    });

    if (res.ok) {
      const data = await res.json();
      const songs = data.results?.songs?.[0]?.data || [];
      if (songs.length > 0) {
        const fetchedTracks = songs.map(mapAppleItemToTrack);
        return [vanz, ...fetchedTracks.filter((t: Track) => t.id !== vanz.id)];
      }
    }
  } catch (err) {
    console.warn("Apple Music API direct call note:", err);
  }

  // 3. Fetch from Apple Music Top Songs RSS Feed (Public Apple Catalog)
  try {
    const rssRes = await fetch(`https://itunes.apple.com/${storefront}/rss/topsongs/limit=30/json`);
    if (rssRes.ok) {
      const data = await rssRes.json();
      const entries = data.feed?.entry || [];
      if (entries.length > 0) {
        const fetchedTracks = entries.map((entry: any): Track => {
          const title = entry['im:name']?.label || 'Untitled';
          const artist = entry['im:artist']?.label || 'Artis Apple Music';
          const rawImg = entry['im:image']?.[2]?.label || entry['im:image']?.[0]?.label || '';
          const audio = entry.link?.[1]?.attributes?.href || entry.link?.[0]?.attributes?.href || '';
          const id = entry.id?.attributes?.['im:id'] || `apple_${Math.random()}`;

          return {
            id: `apple_${id}`,
            title: title,
            artist: artist,
            channelTitle: artist,
            thumbnail: upgradeArtworkUrl(rawImg, 600),
            duration: "3:30",
            durationSeconds: 210,
            audioUrl: audio,
            viewCount: "Apple Music Top Chart",
            source: "apple"
          };
        });

        return [vanz, ...fetchedTracks.filter((t: Track) => t.id !== vanz.id)];
      }
    }
  } catch (e) {
    console.warn("Apple RSS failed, fallback to curated:", e);
  }

  // 4. Fallback to iTunes Search Top Hits
  try {
    const hits = await searchAppleMusic('top hits indonesia', storefront);
    if (hits.length > 0) {
      return [vanz, ...hits.filter(t => t.id !== vanz.id)];
    }
  } catch {}

  return FALLBACK_APPLE_TRACKS;
}

// Search Apple Music Catalog with User Token
export async function searchAppleMusic(query: string, storefront = 'id'): Promise<Track[]> {
  if (!query || !query.trim()) return [];

  // 1. Try internal backend proxy (with full Authorization Bearer & media-user-token, no CORS restrictions)
  try {
    const res = await fetch(`/api/apple-music/search?term=${encodeURIComponent(query)}&storefront=${storefront}&limit=25`);
    if (res.ok) {
      const data = await res.json();
      const songs = data.results?.songs?.data || [];
      if (songs.length > 0) {
        return songs.map(mapAppleItemToTrack);
      }
    }
  } catch (err) {
    console.warn("Backend Apple Music search proxy note:", err);
  }

  // 2. Try direct Apple Music API with User Token and Developer Token
  try {
    const res = await fetch(`https://amp-api.music.apple.com/v1/catalog/${storefront}/search?term=${encodeURIComponent(query)}&types=songs&limit=25`, {
      headers: getAppleAuthHeaders()
    });

    if (res.ok) {
      const data = await res.json();
      const songs = data.results?.songs?.data || [];
      if (songs.length > 0) {
        return songs.map(mapAppleItemToTrack);
      }
    }
  } catch (err) {
    console.warn("Apple Music API search note:", err);
  }

  // 3. Fetch from Apple iTunes Search API (Official Apple Music Catalog)
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=25`;
    const res = await fetch(itunesUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results.map((item: any): Track => {
          const durationSec = Math.round((item.trackTimeMillis || 180000) / 1000);
          const rawArt = item.artworkUrl100 || item.artworkUrl60 || '';
          return {
            id: `apple_${item.trackId}`,
            appleSongId: String(item.trackId),
            title: item.trackName || 'Untitled',
            artist: item.artistName || 'Artis Apple Music',
            channelTitle: item.collectionName || item.artistName,
            thumbnail: upgradeArtworkUrl(rawArt, 600),
            duration: formatDuration(durationSec),
            durationSeconds: durationSec,
            audioUrl: item.previewUrl,
            viewCount: item.primaryGenreName ? `${item.primaryGenreName} • Apple DRM` : 'Apple Music DRM',
            source: 'apple',
            isDrmProtected: true
          };
        });
      }
    }
  } catch (err) {
    console.error("Apple Music catalog search error:", err);
  }

  return [];
}

// Lyrics helper
export async function getTrackLyrics(title: string, artist: string, duration = 210): Promise<LyricLine[]> {
  try {
    const { fetchRealTrackLyrics } = await import('./lyricsService');
    const res = await fetchRealTrackLyrics(title, artist, undefined, duration);
    return res.lyrics || [];
  } catch {
    return [];
  }
}

// Aliases for seamless migration from YouTube Data v3 to Apple Music API
export const getTrendingMusic = getAppleMusicTrending;
export const searchYouTubeMusic = searchAppleMusic;
