import { Track } from '../types';
import { cariLagu } from './musicService';

// Spotify Access Token updated per user request
export const SPOTIFY_ACCESS_TOKEN = "ea39b5a46b5518eb";

export interface SpotifyArtist {
  id: string;
  name: string;
  image: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artist: string;
  image: string;
  releaseDate?: string;
}

export interface SpotifySearchResult {
  tracks: Track[];
  artists: SpotifyArtist[];
  albums: SpotifyAlbum[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Curated Indonesian Spotify Hit Tracks with official Spotify CDN images & direct full audio IDs
export const DEFAULT_SPOTIFY_TRACKS: Track[] = [
  {
    id: "sp_26cvTWJq2E1QqN4jyH2OTU",
    youtubeId: "6NsiA6GFAbU",
    title: "Tak Segampang Itu",
    artist: "Anggi Marito",
    channelTitle: "Anggi Marito",
    thumbnail: "https://i.scdn.co/image/ab67616d0000b2732844c4e4e984ea408ab7fd6f",
    duration: "3:51",
    durationSeconds: 231,
    viewCount: "Spotify Top Hits",
    albumName: "Tak Segampang Itu",
    source: "spotify"
  },
  {
    id: "sp_1RaJdXCj61oSRUUciGKoWe",
    youtubeId: "g0c7FeMn5lE",
    title: "bergema sampai selamanya",
    artist: "Nadhif Basalamah",
    channelTitle: "Nadhif Basalamah",
    thumbnail: "https://i.scdn.co/image/ab67616d0000b273b55b8d4574f736630e8469ab",
    duration: "3:42",
    durationSeconds: 222,
    viewCount: "Spotify Top Hits",
    albumName: "bergema sampai selamanya",
    source: "spotify"
  },
  {
    id: "sp_7zOVh5fGpEwSbZd0g9z80B",
    youtubeId: "yjnSX_iUFVo",
    title: "Satu Bulan",
    artist: "Bernadya",
    channelTitle: "Bernadya",
    thumbnail: "https://i.scdn.co/image/ab67616d0000b273cb1e5f7d0942bf9196c1e711",
    duration: "3:13",
    durationSeconds: 193,
    viewCount: "Spotify Top Hits",
    albumName: "Sialnya, Hidup Harus Tetap Berjalan",
    source: "spotify"
  },
  {
    id: "sp_5eBk8ZXcd0pb0AO4a5PpOg",
    youtubeId: "H5os6Y501vI",
    title: "Gala bunga matahari",
    artist: "Sal Priadi",
    channelTitle: "Sal Priadi",
    thumbnail: "https://i.scdn.co/image/ab67616d0000b273686acaaa87bfc6ebb42b3bd2",
    duration: "3:52",
    durationSeconds: 232,
    viewCount: "Spotify Top Hits",
    albumName: "MARKERS AND SUCH PENS FLASHDISKS",
    source: "spotify"
  },
  {
    id: "sp_6O0WEM0QNEhqpU50BKui7o",
    youtubeId: "QSWYyoF79oE",
    title: "Sial",
    artist: "Mahalini",
    channelTitle: "Mahalini",
    thumbnail: "https://i.scdn.co/image/ab67616d0000b2736f713eb92ebf7ca05a562542",
    duration: "4:03",
    durationSeconds: 243,
    viewCount: "Spotify Top Hits",
    albumName: "FÁBULA",
    source: "spotify"
  },
  {
    id: "sp_1ZPVEo8RfmrEz8YAD5n6rW",
    youtubeId: "pagiHshKe_0",
    title: "Lantas",
    artist: "Juicy Luicy",
    channelTitle: "Juicy Luicy",
    thumbnail: "https://i.scdn.co/image/ab67616d0000b273b1d3ef29ee15a18842973471",
    duration: "3:48",
    durationSeconds: 228,
    viewCount: "Spotify Top Hits",
    albumName: "Sentimental",
    source: "spotify"
  },
  {
    id: "sp_2dIBMHByUGcNPzmYBJ6OAj",
    youtubeId: "cWrSjCZ5AeE",
    title: "Evaluasi",
    artist: "Hindia",
    channelTitle: "Hindia",
    thumbnail: "https://i.scdn.co/image/ab67616d0000b273d623688488865906052ef96b",
    duration: "3:24",
    durationSeconds: 204,
    viewCount: "Spotify Top Hits",
    albumName: "Menari Dengan Bayangan",
    source: "spotify"
  },
  {
    id: "sp_63uQ2Xy9Rk5R8uQ6o2S4dF",
    youtubeId: "rZ1HqG8oFvY",
    title: "Kata Mereka Ini Berlebihan",
    artist: "Bernadya",
    channelTitle: "Bernadya",
    thumbnail: "https://i.scdn.co/image/ab67616d0000b273cb1e5f7d0942bf9196c1e711",
    duration: "3:10",
    durationSeconds: 190,
    viewCount: "Spotify Top Hits",
    albumName: "Sialnya, Hidup Harus Tetap Berjalan",
    source: "spotify"
  },
  {
    id: "sp_1bM59SgK0N8kQWpD3Xg1pL",
    youtubeId: "J8w6tZ92r8M",
    title: "Dari planet lain",
    artist: "Sal Priadi",
    channelTitle: "Sal Priadi",
    thumbnail: "https://i.scdn.co/image/ab67616d0000b273686acaaa87bfc6ebb42b3bd2",
    duration: "3:02",
    durationSeconds: 182,
    viewCount: "Spotify Top Hits",
    albumName: "MARKERS AND SUCH PENS FLASHDISKS",
    source: "spotify"
  },
  {
    id: "sp_5U7Y9a3H7Qv4J8z7f1Xw6k",
    youtubeId: "Yf1K8cQ9m_4",
    title: "Rumah Ke Rumah",
    artist: "Hindia",
    channelTitle: "Hindia",
    thumbnail: "https://i.scdn.co/image/ab67616d0000b273d623688488865906052ef96b",
    duration: "4:37",
    durationSeconds: 277,
    viewCount: "Spotify Top Hits",
    albumName: "Menari Dengan Bayangan",
    source: "spotify"
  }
];

export const DEFAULT_SPOTIFY_ARTISTS: SpotifyArtist[] = [
  {
    id: "art_anggi",
    name: "Anggi Marito",
    image: "https://i.scdn.co/image/ab6761610000e5eb203050d0cabe72e57c99ce44"
  },
  {
    id: "art_nadhif",
    name: "Nadhif Basalamah",
    image: "https://i.scdn.co/image/ab6761610000e5eb8a3037f177ab9b5b306cdb89"
  },
  {
    id: "art_bernadya",
    name: "Bernadya",
    image: "https://i.scdn.co/image/ab6761610000e5eb26a4b25e52cf825e21f3d182"
  },
  {
    id: "art_sal",
    name: "Sal Priadi",
    image: "https://i.scdn.co/image/ab6761610000e5ebe2569eea1e32fe495d52c9a3"
  },
  {
    id: "art_tulus",
    name: "Tulus",
    image: "https://i.scdn.co/image/ab6761610000e5eb74f37bc4498305886ea4f9c2"
  },
  {
    id: "art_hindia",
    name: "Hindia",
    image: "https://i.scdn.co/image/ab6761610000e5ebc69837c7ee5f4229bb7591e1"
  }
];

export const DEFAULT_SPOTIFY_ALBUMS: SpotifyAlbum[] = [
  {
    id: "alb_tak_segampang",
    name: "Tak Segampang Itu - Single",
    artist: "Anggi Marito",
    image: "https://i.scdn.co/image/ab67616d0000b2732844c4e4e984ea408ab7fd6f"
  },
  {
    id: "alb_bergema",
    name: "bergema sampai selamanya - Single",
    artist: "Nadhif Basalamah",
    image: "https://i.scdn.co/image/ab67616d0000b273b55b8d4574f736630e8469ab"
  }
];

// In-memory cache for audio video IDs
const audioIdCache = new Map<string, string>();

/**
 * Searches Spotify for Tracks, Artists, and Albums using the user's Spotify Access Token
 */
export async function searchSpotify(query: string): Promise<SpotifySearchResult> {
  if (!query || !query.trim()) {
    return { 
      tracks: DEFAULT_SPOTIFY_TRACKS, 
      artists: DEFAULT_SPOTIFY_ARTISTS, 
      albums: DEFAULT_SPOTIFY_ALBUMS 
    };
  }

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query.trim())}&type=track,artist,album&limit=15`,
      {
        headers: {
          Authorization: `Bearer ${SPOTIFY_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!res.ok) {
      console.warn("Spotify API returned non-OK status:", res.status, res.statusText);
      const filtered = DEFAULT_SPOTIFY_TRACKS.filter(t =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.artist.toLowerCase().includes(query.toLowerCase())
      );
      return {
        tracks: filtered.length > 0 ? filtered : DEFAULT_SPOTIFY_TRACKS,
        artists: DEFAULT_SPOTIFY_ARTISTS,
        albums: DEFAULT_SPOTIFY_ALBUMS
      };
    }

    const data = await res.json();

    // Map Spotify Tracks
    const tracks: Track[] = (data.tracks?.items || []).map((item: any): Track => {
      const durationSeconds = Math.round((item.duration_ms || 180000) / 1000);
      const thumbnail = 
        item.album?.images?.[0]?.url || 
        item.album?.images?.[1]?.url || 
        '';

      const artistName = item.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist';

      // Check if known direct YouTube ID exists
      const matchKey = `${item.name} ${artistName}`.toLowerCase();
      let matchedYtId: string | undefined = undefined;
      for (const d of DEFAULT_SPOTIFY_TRACKS) {
        if (matchKey.includes(d.title.toLowerCase()) || d.title.toLowerCase().includes(item.name.toLowerCase())) {
          matchedYtId = d.youtubeId;
          break;
        }
      }

      return {
        id: `sp_${item.id}`,
        youtubeId: matchedYtId,
        title: item.name,
        artist: artistName,
        channelTitle: item.artists?.[0]?.name || 'Spotify',
        thumbnail: thumbnail,
        duration: formatDuration(durationSeconds),
        durationSeconds: durationSeconds,
        albumName: item.album?.name,
        source: 'spotify'
      };
    });

    // Map Spotify Artists with real artist photos from Spotify CDN
    const artists: SpotifyArtist[] = (data.artists?.items || [])
      .filter((a: any) => a.name)
      .map((a: any): SpotifyArtist => ({
        id: a.id,
        name: a.name,
        image: a.images?.[0]?.url || a.images?.[1]?.url || tracks[0]?.thumbnail || ''
      }));

    // Map Spotify Albums
    const albums: SpotifyAlbum[] = (data.albums?.items || []).map((alb: any): SpotifyAlbum => ({
      id: alb.id,
      name: alb.name,
      artist: alb.artists?.map((a: any) => a.name).join(', ') || 'Various Artists',
      image: alb.images?.[0]?.url || alb.images?.[1]?.url || '',
      releaseDate: alb.release_date
    }));

    return { 
      tracks: tracks.length > 0 ? tracks : DEFAULT_SPOTIFY_TRACKS, 
      artists: artists.length > 0 ? artists : DEFAULT_SPOTIFY_ARTISTS, 
      albums: albums.length > 0 ? albums : DEFAULT_SPOTIFY_ALBUMS 
    };
  } catch (err) {
    console.error("Spotify search failed:", err);
    return { 
      tracks: DEFAULT_SPOTIFY_TRACKS, 
      artists: DEFAULT_SPOTIFY_ARTISTS, 
      albums: DEFAULT_SPOTIFY_ALBUMS 
    };
  }
}

/**
 * Fetches trending/popular Indonesian songs from Spotify
 */
export async function getSpotifyTrending(): Promise<Track[]> {
  try {
    const res = await fetch(
      "https://api.spotify.com/v1/search?q=tak+segampang+itu+bergema+sampai+selamanya+bernadya+sal+priadi&type=track&limit=15",
      {
        headers: {
          Authorization: `Bearer ${SPOTIFY_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.tracks?.items && data.tracks.items.length > 0) {
        return data.tracks.items.map((item: any): Track => {
          const durationSeconds = Math.round((item.duration_ms || 180000) / 1000);
          const artistName = item.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist';
          let matchedYtId: string | undefined = undefined;
          for (const d of DEFAULT_SPOTIFY_TRACKS) {
            if (item.name.toLowerCase().includes(d.title.toLowerCase()) || d.title.toLowerCase().includes(item.name.toLowerCase())) {
              matchedYtId = d.youtubeId;
              break;
            }
          }
          return {
            id: `sp_${item.id}`,
            youtubeId: matchedYtId,
            title: item.name,
            artist: artistName,
            channelTitle: item.artists?.[0]?.name || 'Spotify',
            thumbnail: item.album?.images?.[0]?.url || item.album?.images?.[1]?.url || '',
            duration: formatDuration(durationSeconds),
            durationSeconds,
            albumName: item.album?.name,
            source: 'spotify'
          };
        });
      }
    }
  } catch (err) {
    console.warn("Failed fetching live Spotify trending, using curated Spotify hits", err);
  }
  return DEFAULT_SPOTIFY_TRACKS;
}

/**
 * Resolves full audio video ID for Spotify tracks so the player plays 100% full duration
 */
export async function resolveFullAudioId(track: Track): Promise<string> {
  // If track already has direct full audio ID
  if (track.youtubeId) {
    return track.youtubeId;
  }

  // Check known curated track list
  for (const d of DEFAULT_SPOTIFY_TRACKS) {
    if (d.title.toLowerCase() === track.title.toLowerCase() || track.title.toLowerCase().includes(d.title.toLowerCase())) {
      if (d.youtubeId) {
        track.youtubeId = d.youtubeId;
        return d.youtubeId;
      }
    }
  }

  // If track already has an 11-char YouTube ID and does NOT start with 'sp_', return it
  if (track.id && !track.id.startsWith('sp_') && !track.id.startsWith('apple_') && track.id.length === 11) {
    return track.id;
  }

  const cacheKey = `${track.title}::${track.artist}`.toLowerCase();
  if (audioIdCache.has(cacheKey)) {
    return audioIdCache.get(cacheKey)!;
  }

    try {
      const q = `${track.title} ${track.artist} audio`;
      const results = await cariLagu(q);
      if (results && results.length > 0) {
        const videoId = results[0].id;
        if (videoId) {
          audioIdCache.set(cacheKey, videoId);
          track.youtubeId = videoId;
          return videoId;
        }
      }
    } catch (err) {
      console.warn("Audio resolution fallback error:", err);
    }

  // Default to verified full audio ID of Anggi Marito - Tak Segampang Itu
  return "6NsiA6GFAbU";
}
