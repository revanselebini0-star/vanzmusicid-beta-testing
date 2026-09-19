import { LyricLine, Track } from '../types';

export const YOUTUBE_API_KEY = "AIzaSyCkgMSlcwK1XO4VFzRF8IH8NE8tyCtwP2s";

// Curated top fallback tracks with verified YouTube IDs and official music covers
export const FALLBACK_TRENDING_TRACKS: Track[] = [
  {
    id: "kJQP7kiw5Fk",
    title: "Despacito",
    artist: "Luis Fonsi ft. Daddy Yankee",
    thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    duration: "4:42",
    durationSeconds: 282,
    viewCount: "8.4 Milyar tayangan",
    channelTitle: "Luis Fonsi"
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    thumbnail: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
    duration: "6:00",
    durationSeconds: 360,
    viewCount: "1.7 Milyar tayangan",
    channelTitle: "Queen Official"
  },
  {
    id: "JGwWNGJdvx8",
    title: "Shape of You",
    artist: "Ed Sheeran",
    thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",
    duration: "4:24",
    durationSeconds: 264,
    viewCount: "6.2 Milyar tayangan",
    channelTitle: "Ed Sheeran"
  },
  {
    id: "OPf0YbXqDm0",
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    thumbnail: "https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg",
    duration: "4:31",
    durationSeconds: 271,
    viewCount: "5.1 Milyar tayangan",
    channelTitle: "MarkRonsonVEVO"
  },
  {
    id: "YQHsXMglC9A",
    title: "Hello",
    artist: "Adele",
    thumbnail: "https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg",
    duration: "6:07",
    durationSeconds: 367,
    viewCount: "3.2 Milyar tayangan",
    channelTitle: "AdeleVEVO"
  },
  {
    id: "CevxZvSJLk8",
    title: "Roar",
    artist: "Katy Perry",
    thumbnail: "https://i.ytimg.com/vi/CevxZvSJLk8/hqdefault.jpg",
    duration: "4:30",
    durationSeconds: 270,
    viewCount: "3.9 Milyar tayangan",
    channelTitle: "KatyPerryVEVO"
  },
  {
    id: "09R8_2nJtjg",
    title: "Sugar",
    artist: "Maroon 5",
    thumbnail: "https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg",
    duration: "5:02",
    durationSeconds: 302,
    viewCount: "4.0 Milyar tayangan",
    channelTitle: "Maroon5VEVO"
  },
  {
    id: "Nskf70DMR60",
    title: "Sesi Potret",
    artist: "enau ft. Ari Lesmana",
    thumbnail: "https://i.ytimg.com/vi/Nskf70DMR60/hqdefault.jpg",
    duration: "4:15",
    durationSeconds: 255,
    viewCount: "18 Juta tayangan",
    channelTitle: "Aku eńau"
  }
];

// Curated top viral & trending songs (TikTok, Reels, Indonesia Top Charts) with official covers
export const VIRAL_RECOMMENDED_TRACKS: Track[] = [
  {
    id: "9hjMIOIysng",
    title: "Kata Mereka Ini Berlebihan",
    artist: "Bernadya",
    thumbnail: "https://i.ytimg.com/vi/9hjMIOIysng/hqdefault.jpg",
    duration: "3:18",
    durationSeconds: 198,
    viewCount: "74 Juta tayangan",
    channelTitle: "BernadyaVEVO"
  },
  {
    id: "kPa7bsKwL-c",
    title: "Die With A Smile",
    artist: "Lady Gaga & Bruno Mars",
    thumbnail: "https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg",
    duration: "4:12",
    durationSeconds: 252,
    viewCount: "350 Juta tayangan",
    channelTitle: "Lady Gaga"
  },
  {
    id: "AQpEIZ8dNcU",
    title: "Gala Bunga Matahari",
    artist: "Sal Priadi",
    thumbnail: "https://i.ytimg.com/vi/AQpEIZ8dNcU/hqdefault.jpg",
    duration: "3:52",
    durationSeconds: 232,
    viewCount: "82 Juta tayangan",
    channelTitle: "Sal Priadi"
  },
  {
    id: "jia3fhBQ8qI",
    title: "Penjaga Hati",
    artist: "Nadhif Basalamah",
    thumbnail: "https://i.ytimg.com/vi/jia3fhBQ8qI/hqdefault.jpg",
    duration: "4:16",
    durationSeconds: 256,
    viewCount: "95 Juta tayangan",
    channelTitle: "nadhif basalamah"
  },
  {
    id: "ba-XAIskH_g",
    title: "Lantas",
    artist: "Juicy Luicy",
    thumbnail: "https://i.ytimg.com/vi/ba-XAIskH_g/hqdefault.jpg",
    duration: "3:48",
    durationSeconds: 228,
    viewCount: "120 Juta tayangan",
    channelTitle: "Emotion Entertainment"
  },
  {
    id: "V9PVRfjEBTI",
    title: "BIRDS OF A FEATHER",
    artist: "Billie Eilish",
    thumbnail: "https://i.ytimg.com/vi/V9PVRfjEBTI/hqdefault.jpg",
    duration: "3:30",
    durationSeconds: 210,
    viewCount: "210 Juta tayangan",
    channelTitle: "Billie Eilish"
  },
  {
    id: "LAOxuo6pkdo",
    title: "Mati-Matian",
    artist: "Mahalini",
    thumbnail: "https://i.ytimg.com/vi/LAOxuo6pkdo/hqdefault.jpg",
    duration: "4:06",
    durationSeconds: 246,
    viewCount: "48 Juta tayangan",
    channelTitle: "HITS Records"
  },
  {
    id: "cWrSjCZ5AeE",
    title: "Evaluasi",
    artist: "Hindia",
    thumbnail: "https://i.ytimg.com/vi/cWrSjCZ5AeE/hqdefault.jpg",
    duration: "3:24",
    durationSeconds: 204,
    viewCount: "65 Juta tayangan",
    channelTitle: "Hindia"
  },
  {
    id: "yjnSX_iUFVo",
    title: "Satu Bulan",
    artist: "Bernadya",
    thumbnail: "https://i.ytimg.com/vi/yjnSX_iUFVo/hqdefault.jpg",
    duration: "3:20",
    durationSeconds: 200,
    viewCount: "115 Juta tayangan",
    channelTitle: "BernadyaVEVO"
  },
  {
    id: "6NsiA6GFAbU",
    title: "Tak Segampang Itu",
    artist: "Anggi Marito",
    thumbnail: "https://i.ytimg.com/vi/6NsiA6GFAbU/hqdefault.jpg",
    duration: "3:58",
    durationSeconds: 238,
    viewCount: "160 Juta tayangan",
    channelTitle: "AnggiMaritoVEVO"
  }
];

// Parse ISO 8601 duration (e.g. PT4M21S)
export function parseDuration(isoDuration?: string): { formatted: string; seconds: number } {
  if (!isoDuration) return { formatted: "3:30", seconds: 210 };
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { formatted: "3:30", seconds: 210 };

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  let formatted = "";

  if (hours > 0) {
    formatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  return { formatted, seconds: totalSeconds };
}

// Clean up YouTube titles for Apple Music style clean display
export function cleanTitle(rawTitle: string): { title: string; artist: string } {
  let cleaned = rawTitle
    .replace(/\(.*?\)/g, '') // remove parentheses like (Official Video)
    .replace(/\[.*?\]/g, '') // remove brackets like [MV]
    .replace(/\|.*$/g, '')   // remove trailing pipe notes
    .replace(/Official (Music )?Video/gi, '')
    .replace(/Official Audio/gi, '')
    .replace(/Lyric(s)? Video/gi, '')
    .replace(/Music Video/gi, '')
    .replace(/HD|4K/gi, '')
    .trim();

  // If title has "Artist - Song Name"
  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim()
    };
  }

  return {
    title: cleaned || rawTitle,
    artist: "Artis Populer"
  };
}

export function formatViews(views?: string | number): string {
  if (!views) return "";
  const num = typeof views === 'string' ? parseInt(views, 10) : views;
  if (isNaN(num)) return "";
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)} Milyar tayangan`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} Jt tayangan`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)} Rb tayangan`;
  return `${num} tayangan`;
}

// Fetch trending music from YouTube Data API
export async function getTrendingMusic(regionCode = 'ID'): Promise<Track[]> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&videoCategoryId=10&maxResults=24&regionCode=${regionCode}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("YouTube API trending status not ok, falling back to curated list", res.status);
      return FALLBACK_TRENDING_TRACKS;
    }

    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      return FALLBACK_TRENDING_TRACKS;
    }

    return data.items.map((item: any): Track => {
      const { title, artist } = cleanTitle(item.snippet.title);
      const { formatted, seconds } = parseDuration(item.contentDetails?.duration);
      const thumbnail = 
        item.snippet.thumbnails?.maxres?.url ||
        item.snippet.thumbnails?.standard?.url ||
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url;

      return {
        id: item.id,
        title: title,
        artist: artist !== "Artis Populer" ? artist : item.snippet.channelTitle,
        channelTitle: item.snippet.channelTitle,
        thumbnail: thumbnail,
        duration: formatted,
        durationSeconds: seconds,
        viewCount: formatViews(item.statistics?.viewCount),
        publishedAt: item.snippet.publishedAt
      };
    });
  } catch (err) {
    console.error("Error fetching trending YouTube music:", err);
    return FALLBACK_TRENDING_TRACKS;
  }
}

// Search real-time music on YouTube Data API
export async function searchYouTubeMusic(query: string): Promise<Track[]> {
  if (!query.trim()) return [];

  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=20&key=${YOUTUBE_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    
    if (!searchRes.ok) {
      // Fallback search in curated list
      return FALLBACK_TRENDING_TRACKS.filter(t => 
        t.title.toLowerCase().includes(query.toLowerCase()) || 
        t.artist.toLowerCase().includes(query.toLowerCase())
      );
    }

    const searchData = await searchRes.json();
    if (!searchData.items || searchData.items.length === 0) return [];

    const videoIds = searchData.items.map((item: any) => item.id.videoId).filter(Boolean).join(',');

    // Fetch video details for durations & stats
    const detailUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
    const detailRes = await fetch(detailUrl);
    
    if (detailRes.ok) {
      const detailData = await detailRes.json();
      return detailData.items.map((item: any): Track => {
        const { title, artist } = cleanTitle(item.snippet.title);
        const { formatted, seconds } = parseDuration(item.contentDetails?.duration);
        const thumbnail = 
          item.snippet.thumbnails?.maxres?.url ||
          item.snippet.thumbnails?.standard?.url ||
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url;

        return {
          id: item.id,
          title: title,
          artist: artist !== "Artis Populer" ? artist : item.snippet.channelTitle,
          channelTitle: item.snippet.channelTitle,
          thumbnail: thumbnail,
          duration: formatted,
          durationSeconds: seconds,
          viewCount: formatViews(item.statistics?.viewCount)
        };
      });
    }

    // If detail fetch fails, return snippet data
    return searchData.items.map((item: any): Track => {
      const { title, artist } = cleanTitle(item.snippet.title);
      return {
        id: item.id.videoId,
        title: title,
        artist: artist !== "Artis Populer" ? artist : item.snippet.channelTitle,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
        duration: "3:30",
        durationSeconds: 210
      };
    });
  } catch (err) {
    console.error("Search failed:", err);
    return [];
  }
}

// Parse LRC format string "[00:12.34] lyric text"
export function parseLRC(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];

  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2}(?:\.\d+)?)\](.*)/);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseFloat(match[2]);
      const text = match[3].trim();
      if (text) {
        result.push({
          time: mins * 60 + secs,
          text: text
        });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

// Fetch authentic lyrics from lyricsService
export async function getTrackLyrics(title: string, artist: string, duration = 210): Promise<LyricLine[]> {
  try {
    const { fetchRealTrackLyrics } = await import('./lyricsService');
    const res = await fetchRealTrackLyrics(title, artist, undefined, duration);
    return res.lyrics || [];
  } catch {
    return [];
  }
}
