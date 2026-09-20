export interface Track {
  id: string;
  title: string;
  artist: string;
  channelTitle?: string;
  thumbnail: string;
  duration?: string;
  durationSeconds?: number;
  viewCount?: string;
  publishedAt?: string;
  lyrics?: LyricLine[];
}

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface LyricsResult {
  trackId?: string;
  title: string;
  artist: string;
  isSynced: boolean;
  source: 'lrclib_synced' | 'lrclib_plain' | 'textyl_synced' | 'curated_synced' | 'user_manual' | 'not_found';
  lyrics: LyricLine[];
  plainLyrics?: string;
}

export interface LyricsSearchCandidate {
  id: number | string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  isSynced: boolean;
  syncedLyrics?: string;
  plainLyrics?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  tracks: Track[];
  createdAt: number;
  isCustom?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface AdminMessage {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  tag?: 'Update' | 'Fitur Baru' | 'Musik' | 'Pengumuman' | 'Penting';
  createdAt: number;
  authorName?: string;
  authorEmail?: string;
}

export type ViewTab = 'listen_now' | 'library' | 'search' | 'recommendations' | 'radio' | 'account';

export type RepeatMode = 'off' | 'all' | 'one';
