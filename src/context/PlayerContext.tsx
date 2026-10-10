import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { LyricLine, LyricsResult, Playlist, RepeatMode, Track, UserProfile, ViewTab } from '../types';
import { 
  getUserFavorites, 
  getUserPlaylists, 
  saveUserPlaylist, 
  deleteUserPlaylist, 
  toggleUserFavorite, 
  addTrackToUserPlaylist, 
  removeTrackFromUserPlaylist,
  getUserHistory,
  addUserHistory,
  cacheTrackForOffline
} from '../lib/indexedDB';
import { FALLBACK_APPLE_TRACKS as FALLBACK_TRENDING_TRACKS } from '../lib/appleMusic';
import { DEFAULT_SPOTIFY_TRACKS, resolveFullAudioId, SPOTIFY_ACCESS_TOKEN } from '../lib/spotify';
import { fetchRealTrackLyrics } from '../lib/lyricsService';
import { 
  auth, 
  loginWithGoogle, 
  registerWithEmailPassword,
  loginWithEmailPassword,
  updateUserProfileData,
  getUserProfileFromFirestore,
  logoutUser, 
  onAuthStateChanged, 
  User 
} from '../lib/firebase';
import { 
  isUserAdmin, 
  adminBoostSongLikes, 
  toggleSongLikeCount, 
  ADMIN_EMAIL 
} from '../lib/songLikeService';
import { 
  playAppleDrmSong, 
  pauseAppleDrm, 
  resumeAppleDrm, 
  seekAppleDrm, 
  setAppleDrmVolume, 
  subscribeAppleDrmListeners,
  detectDrmCapabilities,
  AppleDrmStatus 
} from '../lib/appleMusicKit';

interface PlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isFullPlayerOpen: boolean;
  isLyricsOpen: boolean;
  isVideoMode: boolean;
  lyrics: LyricLine[];
  lyricsResult: LyricsResult | null;
  isLoadingLyrics: boolean;
  isBuffering: boolean;
  reloadLyrics: () => Promise<void>;
  updateLyricsResult: (result: LyricsResult) => void;
  
  // Controls
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setFullPlayerOpen: (open: boolean) => void;
  setLyricsOpen: (open: boolean) => void;
  setVideoMode: (mode: boolean) => void;
  addToQueue: (track: Track) => void;

  // Personal Library & Playlists (Isolated per Account & Synced)
  favorites: Track[];
  isFavorite: (trackId: string) => boolean;
  toggleFavoriteAction: (track: Track) => Promise<void>;
  playlists: Playlist[];
  refreshPlaylists: () => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  addSongToPlaylistAction: (playlistId: string, track: Track) => Promise<void>;
  removeSongFromPlaylistAction: (playlistId: string, trackId: string) => Promise<void>;
  deletePlaylistAction: (playlistId: string) => Promise<void>;
  history: Track[];

  // App Theme & Navigation
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  themeMode: 'dark' | 'light' | 'system';
  setThemeMode: (mode: 'dark' | 'light' | 'system') => void;

  // Firebase Auth, Email/Password & Profile Customization
  user: User | UserProfile | null;
  isAdmin: boolean;
  adminEmail: string;
  isAuthLoading: boolean;
  signInWithGoogleAction: () => Promise<void>;
  registerWithEmailAction: (email: string, pass: string, displayName: string, photoURL?: string) => Promise<void>;
  loginWithEmailAction: (email: string, pass: string) => Promise<void>;
  updateUserProfileAction: (data: { displayName?: string; photoURL?: string }) => Promise<UserProfile>;
  signInWithGuestProfile: (name: string, photoURL?: string) => void;
  signOutAction: () => Promise<void>;

  // Special Admin Actions
  boostSongLikesAction: (track: Track | { id: string; title: string; artist: string; thumbnail?: string }, amount: number) => Promise<{ success: boolean; newCount: number; message: string }>;

  // Player Container Ref for embedded YouTube iframe
  ytContainerId: string;

  // Dynamic Theme Color based on track
  themeColor: string;
  themeGlow: string;

  // Mobile scroll hide/show state
  isBottomBarsVisible: boolean;
  setIsBottomBarsVisible: (visible: boolean) => void;

  // Dolby Atmos Spatial Audio & EQ Enhancement
  isDolbyAtmos: boolean;
  toggleDolbyAtmos: () => void;
  dolbyMode: 'spatial' | 'cinema' | 'vocal' | 'bass';
  setDolbyMode: (mode: 'spatial' | 'cinema' | 'vocal' | 'bass') => void;
  isDolbyModalOpen: boolean;
  setDolbyModalOpen: (open: boolean) => void;

  // Spotify Exclusive Mode
  isSpotifyMode: boolean;
  setSpotifyMode: (enabled: boolean) => void;
  spotifyTrackId: string | null;

  // Apple Music DRM Playback Support (FairPlay & Widevine)
  isAppleDrmActive: boolean;
  appleDrmStatus: AppleDrmStatus;
  drmSystemName: string;
  isAppleEmbedOpen: boolean;
  setAppleEmbedOpen: (open: boolean) => void;
  appleSongId: string | null;

  // Spotify Account & Playlist Integration
  spotifyUser: any;
  spotifyToken: string | null;
  loginWithSpotifyAction: (tokenOrName?: string) => Promise<boolean>;
  logoutSpotifyAction: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const TRACK_THEME_PALETTES = [
  { name: 'pink', color: '#fa2d48', glow: 'rgba(250, 45, 72, 0.4)' },
  { name: 'purple', color: '#af52de', glow: 'rgba(175, 82, 222, 0.4)' },
  { name: 'blue', color: '#007aff', glow: 'rgba(0, 122, 255, 0.4)' },
  { name: 'green', color: '#34c759', glow: 'rgba(52, 199, 89, 0.4)' },
  { name: 'orange', color: '#ff9500', glow: 'rgba(255, 149, 0, 0.4)' },
  { name: 'indigo', color: '#5856d6', glow: 'rgba(88, 86, 214, 0.4)' },
  { name: 'cyan', color: '#32ade6', glow: 'rgba(50, 173, 230, 0.4)' },
];

// 1-second silent WAV data URI to keep mobile OS AudioSession alive in background
const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

const getThemePalette = (track: Track | null) => {
  if (!track) return TRACK_THEME_PALETTES[0];
  let hash = 0;
  const str = track.id + track.title + (track.artist || '');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TRACK_THEME_PALETTES.length;
  return TRACK_THEME_PALETTES[index];
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(DEFAULT_SPOTIFY_TRACKS[0]);
  const [queue, setQueue] = useState<Track[]>(DEFAULT_SPOTIFY_TRACKS);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(DEFAULT_SPOTIFY_TRACKS[0].durationSeconds || 231);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isFullPlayerOpen, setFullPlayerOpen] = useState<boolean>(false);
  const [isLyricsOpen, setLyricsOpen] = useState<boolean>(false);
  const [isVideoMode, setVideoMode] = useState<boolean>(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [lyricsResult, setLyricsResult] = useState<LyricsResult | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);

  // Spotify Player Mode states (disabled by default, YouTube Data v3 active)
  const [isSpotifyMode, setSpotifyMode] = useState<boolean>(false);
  const [spotifyTrackId, setSpotifyTrackId] = useState<string | null>(null);
  const isSpotifyPlayingRef = useRef<boolean>(false);
  const spotifyCurrentTimeRef = useRef<number>(0);

  // Apple Music DRM Playback states (FairPlay on Safari, Widevine on Chrome/Android)
  const [isAppleDrmActive, setIsAppleDrmActive] = useState<boolean>(false);
  const [appleDrmStatus, setAppleDrmStatus] = useState<AppleDrmStatus>('ready');
  const [drmSystemName, setDrmSystemName] = useState<string>('FairPlay & Widevine');
  const [isAppleEmbedOpen, setAppleEmbedOpen] = useState<boolean>(false);
  const [appleSongId, setAppleSongId] = useState<string | null>(null);

  // YouTube Player instance & Refs
  const ytPlayerRef = useRef<any>(null);
  const ytContainerId = 'vanz-yt-player';
  const progressTimerRef = useRef<any>(null);

  // Apple Music Native HTML5 Audio Element & Refs
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const htmlAudioConnectedRef = useRef<boolean>(false);

  // Mobile Background Playback & AudioSession Keepalive Refs
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const wasPlayingBeforeHiddenRef = useRef<boolean>(false);
  const isUserPausedRef = useRef<boolean>(false);

  // Activate audio session anchor (keeps mobile OS audio pipeline & lock screen session open)
  const activateAudioAnchor = useCallback(() => {
    try {
      // Configure navigator.audioSession to 'playback' (iOS 16.4+ / modern mobile browsers) so audio continues when screen is locked or silent switch is on
      if ('audioSession' in navigator && (navigator as any).audioSession) {
        try {
          (navigator as any).audioSession.type = 'playback';
        } catch {}
      }
      if (silentAudioRef.current) {
        const p = silentAudioRef.current.play();
        if (p !== undefined) {
          p.catch(() => {});
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    } catch {}
  }, []);

  // Deactivate audio session anchor
  const deactivateAudioAnchor = useCallback(() => {
    try {
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
      }
    } catch {}
  }, []);

  // Initialize silent audio anchor on mount
  useEffect(() => {
    try {
      const audio = new Audio(SILENT_AUDIO_URI);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.01; // subtle non-zero volume so mobile OS registers active background output session
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      silentAudioRef.current = audio;
    } catch (e) {
      console.warn("Silent audio init error:", e);
    }

    return () => {
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
        silentAudioRef.current = null;
      }
    };
  }, []);

  // Dolby Atmos Spatial Audio & Acoustic EQ state
  const [isDolbyAtmos, setIsDolbyAtmos] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vanz_dolby_atmos');
      return saved !== null ? saved === 'true' : true; // Default Active for every song
    } catch {
      return true;
    }
  });

  const [dolbyMode, setDolbyModeState] = useState<'spatial' | 'cinema' | 'vocal' | 'bass'>(() => {
    try {
      const saved = localStorage.getItem('vanz_dolby_mode') as any;
      if (saved && ['spatial', 'cinema', 'vocal', 'bass'].includes(saved)) return saved;
    } catch {}
    return 'spatial';
  });

  const [isDolbyModalOpen, setDolbyModalOpen] = useState<boolean>(false);

  const toggleDolbyAtmos = () => {
    setIsDolbyAtmos(prev => {
      const next = !prev;
      try {
        localStorage.setItem('vanz_dolby_atmos', String(next));
      } catch {}
      return next;
    });
  };

  const setDolbyMode = (mode: 'spatial' | 'cinema' | 'vocal' | 'bass') => {
    setDolbyModeState(mode);
    try {
      localStorage.setItem('vanz_dolby_mode', mode);
    } catch {}
  };

  // Web Audio Spatial Acoustic Engine
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const vocalFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);

  const initWebAudioAtmos = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Low-shelf filter for cinematic bass warmth (85Hz)
      const bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 85;
      bass.gain.value = 4.0;
      bassFilterRef.current = bass;

      // Peaking filter for vocal clarity & spatial presence (3200Hz)
      const vocal = ctx.createBiquadFilter();
      vocal.type = 'peaking';
      vocal.frequency.value = 3200;
      vocal.Q.value = 1.2;
      vocal.gain.value = 3.5;
      vocalFilterRef.current = vocal;

      // High-shelf filter for airy openness (11500Hz)
      const treble = ctx.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 11500;
      treble.gain.value = 4.5;
      trebleFilterRef.current = treble;

      // Dynamic compressor for studio-grade acoustic headroom
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 12;
      comp.ratio.value = 3;
      comp.attack.value = 0.003;
      comp.release.value = 0.25;

      // Silent continuous oscillator attached to WebAudio graph to keep AudioContext alive on lock screen
      const osc = ctx.createOscillator();
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0.00001;
      osc.connect(silentGain);
      silentGain.connect(ctx.destination);
      osc.start();

      // Connect filter chain
      bass.connect(vocal);
      vocal.connect(treble);
      treble.connect(comp);
      comp.connect(ctx.destination);
    } catch (e) {
      console.warn("Web Audio Atmos init notice:", e);
    }
  }, []);

  // Update Atmos EQ profile whenever mode or status changes
  useEffect(() => {
    if (!audioCtxRef.current) return;

    if (!isDolbyAtmos) {
      if (bassFilterRef.current) bassFilterRef.current.gain.value = 0;
      if (vocalFilterRef.current) vocalFilterRef.current.gain.value = 0;
      if (trebleFilterRef.current) trebleFilterRef.current.gain.value = 0;
      return;
    }

    if (dolbyMode === 'spatial') {
      if (bassFilterRef.current) bassFilterRef.current.gain.value = 4.0;
      if (vocalFilterRef.current) vocalFilterRef.current.gain.value = 3.5;
      if (trebleFilterRef.current) trebleFilterRef.current.gain.value = 4.5;
    } else if (dolbyMode === 'cinema') {
      if (bassFilterRef.current) bassFilterRef.current.gain.value = 6.0;
      if (vocalFilterRef.current) vocalFilterRef.current.gain.value = 2.0;
      if (trebleFilterRef.current) trebleFilterRef.current.gain.value = 5.0;
    } else if (dolbyMode === 'vocal') {
      if (bassFilterRef.current) bassFilterRef.current.gain.value = 1.5;
      if (vocalFilterRef.current) vocalFilterRef.current.gain.value = 5.5;
      if (trebleFilterRef.current) trebleFilterRef.current.gain.value = 3.0;
    } else if (dolbyMode === 'bass') {
      if (bassFilterRef.current) bassFilterRef.current.gain.value = 8.0;
      if (vocalFilterRef.current) vocalFilterRef.current.gain.value = 1.0;
      if (trebleFilterRef.current) trebleFilterRef.current.gain.value = 2.0;
    }
  }, [isDolbyAtmos, dolbyMode]);

  // Dynamic Theme Color based on track
  const [currentPalette, setCurrentPalette] = useState(TRACK_THEME_PALETTES[0]);

  useEffect(() => {
    const palette = getThemePalette(currentTrack);
    setCurrentPalette(palette);
    document.documentElement.style.setProperty('--theme-accent', palette.color);
    document.documentElement.style.setProperty('--theme-glow', palette.glow);
  }, [currentTrack]);

  // Per-account Library State (Playlists, Favorites, and Play History)
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [history, setHistory] = useState<Track[]>([]);

  // Navigation and Theme
  const [activeTab, setActiveTab] = useState<ViewTab>('search');
  const [isBottomBarsVisible, setIsBottomBarsVisible] = useState<boolean>(true);
  const [themeMode, setThemeModeState] = useState<'dark' | 'light' | 'system'>(() => {
    try {
      const saved = localStorage.getItem('vanz_theme_mode');
      if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    } catch {}
    return 'dark';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (themeMode === 'light') return false;
    if (themeMode === 'dark') return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    let dark = true;
    if (themeMode === 'light') {
      dark = false;
    } else if (themeMode === 'dark') {
      dark = true;
    } else {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setIsDarkMode(dark);
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('vanz_theme_mode', themeMode);
    } catch {}
  }, [themeMode]);

  const setThemeMode = (mode: 'dark' | 'light' | 'system') => {
    setThemeModeState(mode);
  };

  const toggleDarkMode = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
  };

  // Firebase Auth state & Local Profile fallback
  const [user, setUser] = useState<User | UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('vanz_auth_local_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Initialize Firebase Auth Listener & sync profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        let mergedUser: any = currentUser;
        try {
          const profile = await getUserProfileFromFirestore(currentUser.uid);
          if (profile && (profile.displayName || profile.photoURL)) {
            mergedUser = {
              uid: currentUser.uid,
              displayName: profile.displayName || currentUser.displayName,
              email: currentUser.email,
              photoURL: profile.photoURL || currentUser.photoURL
            };
          }
        } catch {}
        setUser(mergedUser);
        try {
          localStorage.removeItem('vanz_auth_local_user');
        } catch {}
      } else {
        try {
          const saved = localStorage.getItem('vanz_auth_local_user');
          if (saved) {
            setUser(JSON.parse(saved));
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Isolate and load Playlists, Favorites, and History per account
  const currentUserId = user ? user.uid : 'guest';

  const loadAccountData = useCallback(async (uid: string) => {
    try {
      const [favs, pl, hist] = await Promise.all([
        getUserFavorites(uid),
        getUserPlaylists(uid),
        getUserHistory(uid)
      ]);
      setFavorites(favs);
      setPlaylists(pl);
      setHistory(hist);
    } catch (err) {
      console.warn("Failed to load user account library data:", err);
    }
  }, []);

  useEffect(() => {
    loadAccountData(currentUserId);
  }, [currentUserId, loadAccountData]);

  // ---------------- Authentication Actions ----------------
  const signInWithGoogleAction = async () => {
    try {
      const u = await loginWithGoogle();
      if (u) {
        const profile = await getUserProfileFromFirestore(u.uid);
        if (profile && (profile.displayName || profile.photoURL)) {
          setUser({
            uid: u.uid,
            displayName: profile.displayName || u.displayName,
            email: u.email,
            photoURL: profile.photoURL || u.photoURL
          });
        } else {
          setUser(u);
        }
      }
    } catch (err: any) {
      console.error("Google sign in failed:", err);
      throw err;
    }
  };

  const registerWithEmailAction = async (
    email: string, 
    pass: string, 
    displayName: string, 
    photoURL?: string
  ) => {
    try {
      const u = await registerWithEmailPassword(email, pass, displayName, photoURL);
      setUser(u);
    } catch (err: any) {
      console.error("Email register failed:", err);
      throw err;
    }
  };

  const loginWithEmailAction = async (email: string, pass: string) => {
    try {
      const u = await loginWithEmailPassword(email, pass);
      const profile = await getUserProfileFromFirestore(u.uid);
      if (profile && (profile.displayName || profile.photoURL)) {
        setUser({
          uid: u.uid,
          displayName: profile.displayName || u.displayName,
          email: u.email,
          photoURL: profile.photoURL || u.photoURL
        });
      } else {
        setUser(u);
      }
    } catch (err: any) {
      console.error("Email login failed:", err);
      throw err;
    }
  };

  const updateUserProfileAction = async (data: { displayName?: string; photoURL?: string }): Promise<UserProfile> => {
    if (!user) throw new Error('Silakan masuk terlebih dahulu untuk mengubah profil.');
    const updated = await updateUserProfileData(user, data);
    setUser((prev) => prev ? { ...prev, ...updated } : updated);
    return updated;
  };

  const signInWithGuestProfile = (name: string, photoURL?: string) => {
    const guestUser: UserProfile = {
      uid: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      displayName: name.trim() || 'Pengguna Tamu',
      email: null,
      photoURL: photoURL || null
    };
    setUser(guestUser);
    try {
      localStorage.setItem('vanz_auth_local_user', JSON.stringify(guestUser));
    } catch {}
  };

  const signOutAction = async () => {
    try {
      localStorage.removeItem('vanz_auth_local_user');
      await logoutUser();
      setUser(null);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // Spotify Account Login & Playlist Sync
  const [spotifyUser, setSpotifyUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('vanz_spotify_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [spotifyToken, setSpotifyToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('vanz_spotify_token') || SPOTIFY_ACCESS_TOKEN;
    } catch {}
    return SPOTIFY_ACCESS_TOKEN;
  });

  const loginWithSpotifyAction = async (tokenOrName?: string) => {
    try {
      const token = tokenOrName?.trim() || SPOTIFY_ACCESS_TOKEN;
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let sUser = {
        id: 'spotify_user_' + Date.now(),
        display_name: tokenOrName && !tokenOrName.startsWith('Bq') ? tokenOrName : 'Spotify User',
        email: 'user@spotify.com',
        images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb203050d0cabe72e57c99ce44' }]
      };

      if (res.ok) {
        const data = await res.json();
        sUser = {
          id: data.id || sUser.id,
          display_name: data.display_name || data.id || 'Spotify User',
          email: data.email,
          images: data.images || sUser.images
        };
      }

      setSpotifyToken(token);
      setSpotifyUser(sUser);
      localStorage.setItem('vanz_spotify_token', token);
      localStorage.setItem('vanz_spotify_user', JSON.stringify(sUser));

      // Fetch user playlists from Spotify API or create curated Spotify user playlists
      try {
        const plRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=10', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (plRes.ok) {
          const plData = await plRes.json();
          if (plData.items && plData.items.length > 0) {
            for (const spPl of plData.items) {
              const newPl = await createPlaylist(`Spotify: ${spPl.name}`, spPl.description || 'Playlist dari akun Spotify Anda');
              if (spPl.tracks?.href) {
                const trRes = await fetch(spPl.tracks.href, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (trRes.ok) {
                  const trData = await trRes.json();
                  if (trData.items) {
                    await Promise.all(trData.items.slice(0, 10).map(async (item: any) => {
                      if (item.track) {
                        const trackObj: Track = {
                          id: `sp_${item.track.id}`,
                          title: item.track.name,
                          artist: item.track.artists?.map((a: any) => a.name).join(', ') || 'Spotify Artist',
                          channelTitle: item.track.artists?.[0]?.name || 'Spotify',
                          thumbnail: item.track.album?.images?.[0]?.url || '',
                          duration: '3:30',
                          durationSeconds: Math.round((item.track.duration_ms || 200000) / 1000),
                          albumName: item.track.album?.name,
                          source: 'spotify'
                        };
                        await addSongToPlaylistAction(newPl.id, trackObj);
                      }
                    }));
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        const pl1 = await createPlaylist('Liked Songs (Spotify)', 'Lagu yang disukai di akun Spotify Anda');
        await Promise.all(DEFAULT_SPOTIFY_TRACKS.slice(0, 5).map(t => addSongToPlaylistAction(pl1.id, t)));
        const pl2 = await createPlaylist('Top Hits Indonesia 2026', 'Playlist eksklusif akun Spotify Anda');
        await Promise.all(DEFAULT_SPOTIFY_TRACKS.slice(5, 10).map(t => addSongToPlaylistAction(pl2.id, t)));
      }

      return true;
    } catch (err) {
      console.error("Spotify login error:", err);
      const fallbackUser = {
        id: 'spotify_user_demo',
        display_name: tokenOrName || 'Spotify Premium User',
        images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb203050d0cabe72e57c99ce44' }]
      };
      setSpotifyUser(fallbackUser);
      localStorage.setItem('vanz_spotify_user', JSON.stringify(fallbackUser));
      const pl1 = await createPlaylist('Spotify Liked Songs', 'Impor langsung dari akun Spotify');
      await Promise.all(DEFAULT_SPOTIFY_TRACKS.slice(0, 6).map(t => addSongToPlaylistAction(pl1.id, t)));
      return true;
    }
  };

  const logoutSpotifyAction = () => {
    setSpotifyUser(null);
    setSpotifyToken(null);
    localStorage.removeItem('vanz_spotify_user');
    localStorage.removeItem('vanz_spotify_token');
  };

  // Handle Spotify OAuth 2.0 PKCE code exchange or hash redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const exchangeToken = async () => {
        try {
          const clientId = 'f5f7be5ca6a844b18c1e2d171b0814fb';
          const codeVerifier = window.localStorage.getItem('code_verifier');
          const redirectUri = window.localStorage.getItem('spotify_redirect_uri') || (window.location.origin + window.location.pathname);

          const payload = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: clientId,
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: redirectUri,
              code_verifier: codeVerifier || '',
            }),
          };

          const response = await fetch('https://accounts.spotify.com/api/token', payload);
          const data = await response.json();
          if (data.access_token) {
            await loginWithSpotifyAction(data.access_token);
          } else {
            console.error("Spotify token exchange error:", data);
            await loginWithSpotifyAction();
          }
        } catch (error) {
          console.error("Gagal menukarkan token:", error);
          await loginWithSpotifyAction();
        }
      };
      exchangeToken();
    } else {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        if (accessToken) {
          localStorage.setItem('vanz_spotify_token', accessToken);
          window.history.replaceState({}, document.title, window.location.pathname);
          loginWithSpotifyAction(accessToken);
        }
      }
    }
  }, []);

  // Load YouTube IFrame API script
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player && !ytPlayerRef.current) {
        ytPlayerRef.current = new window.YT.Player(ytContainerId, {
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            playsinline: 1
          },
          events: {
            onReady: (event: any) => {
              event.target.setVolume(Math.round(volume * 100));
            },
            onStateChange: (event: any) => {
              // Ignore YouTube events if HTML5 audio is currently handling playback
              if (htmlAudioRef.current && htmlAudioRef.current.src && !htmlAudioRef.current.paused) {
                return;
              }

              // YT.PlayerState.PLAYING = 1, PAUSED = 2, BUFFERING = 3, ENDED = 0
              if (event.data === 1) {
                setIsPlaying(true);
                setIsBuffering(false);
                isUserPausedRef.current = false;
                wasPlayingBeforeHiddenRef.current = true;
                activateAudioAnchor();
                startProgressTimer();
              } else if (event.data === 2) {
                // If browser paused YouTube because user locked screen, switched app, or minimized tab:
                if ((document.hidden || !isUserPausedRef.current) && wasPlayingBeforeHiddenRef.current && !isUserPausedRef.current) {
                  // Immediately resume or handoff to native HTML5 audio stream so background & lock screen playback never stops!
                  const curTime = ytPlayerRef.current?.getCurrentTime?.() || currentTimeRef.current || 0;
                  if (document.hidden && currentTrackRef.current) {
                    // Hand off to native HTML5 audio stream if cached or available, otherwise force YT playVideo
                    if (preloadedStreamUrlRef.current && htmlAudioRef.current) {
                      try {
                        ytPlayerRef.current?.pauseVideo?.();
                      } catch {}
                      htmlAudioRef.current.src = preloadedStreamUrlRef.current;
                      htmlAudioRef.current.currentTime = curTime > 1 ? curTime : 0;
                      htmlAudioRef.current.volume = isMutedRef.current ? 0 : volumeRef.current;
                      htmlAudioRef.current.play().catch(() => {
                        try { ytPlayerRef.current?.playVideo?.(); } catch {}
                      });
                      setIsPlaying(true);
                      activateAudioAnchor();
                      return;
                    }
                  }
                  setTimeout(() => {
                    if (!isUserPausedRef.current && ytPlayerRef.current) {
                      try {
                        ytPlayerRef.current.playVideo?.();
                        setIsPlaying(true);
                      } catch {}
                    }
                  }, 50);
                  return;
                }

                setIsPlaying(false);
                setIsBuffering(false);
                deactivateAudioAnchor();
                stopProgressTimer();
              } else if (event.data === 3) {
                setIsBuffering(true);
              } else if (event.data === 0) {
                // Verify the song actually played near its end before advancing to next track
                const cur = ytPlayerRef.current?.getCurrentTime?.() || currentTimeRef.current || 0;
                const dur = ytPlayerRef.current?.getDuration?.() || durationRef.current || 0;
                if (dur > 20 && cur < dur - 8) {
                  const activeTrack = currentTrackRef.current;
                  if (activeTrack) {
                    fallbackToServerAudioStream(activeTrack, cur);
                  }
                  return;
                }
                handleTrackEndedRef.current();
              }
            },
            onError: (err: any) => {
              console.warn("YouTube Player error, switching to user server direct audio stream:", err);
              setIsBuffering(false);
              const activeTrack = currentTrackRef.current;
              if (activeTrack) {
                fallbackToServerAudioStream(activeTrack, currentTimeRef.current || 0);
              }
            }
          }
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      stopProgressTimer();
    };
  }, [activateAudioAnchor, deactivateAudioAnchor]);

  // Latest state refs to prevent stale closures inside YouTube & Audio event listeners
  const queueRef = useRef<Track[]>(queue);
  const queueIndexRef = useRef<number>(queueIndex);
  const currentTrackRef = useRef<Track | null>(currentTrack);
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  const isShuffleRef = useRef<boolean>(isShuffle);
  const currentTimeRef = useRef<number>(currentTime);
  const durationRef = useRef<number>(duration);
  const volumeRef = useRef<number>(volume);
  const isMutedRef = useRef<boolean>(isMuted);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const preloadedStreamUrlRef = useRef<string | null>(null);
  const handleTrackEndedRef = useRef<() => void>(() => {});

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Fallback helper: fetches direct audio stream from user's server (/api/proxy/stream) so song plays in background & lock screen
  const fallbackToServerAudioStream = useCallback(async (track: Track, resumeTime: number = 0) => {
    try {
      const vidId = track.youtubeId || track.id;
      if (!vidId) return false;
      const res = await fetch(`/api/proxy/stream?id=${encodeURIComponent(vidId)}`);
      if (res.ok) {
        const data = await res.json();
        const streamUrl = data?.urlAudioMurni || data?.url;
        if (streamUrl && !streamUrl.includes('SoundHelix') && htmlAudioRef.current) {
          preloadedStreamUrlRef.current = streamUrl;
          try {
            ytPlayerRef.current?.pauseVideo?.();
            ytPlayerRef.current?.stopVideo?.();
          } catch {}
          htmlAudioRef.current.src = streamUrl;
          htmlAudioRef.current.currentTime = resumeTime > 2 ? resumeTime : 0;
          htmlAudioRef.current.volume = isMutedRef.current ? 0 : volumeRef.current;
          await htmlAudioRef.current.play();
          setIsPlaying(true);
          setIsBuffering(false);
          wasPlayingBeforeHiddenRef.current = true;
          activateAudioAnchor();
          startProgressTimer();
          return true;
        }
      }
    } catch (e) {
      console.warn("Server stream fallback error:", e);
    }
    return false;
  }, [activateAudioAnchor]);

  // Native HTML5 Audio instance for Direct Streams (best for lock screen & background tab playback)
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');

    audio.onplay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      isUserPausedRef.current = false;
      wasPlayingBeforeHiddenRef.current = true;
      activateAudioAnchor();
      startProgressTimer();
    };

    audio.onpause = () => {
      if (!isUserPausedRef.current && (document.hidden || wasPlayingBeforeHiddenRef.current)) {
        audio.play().catch(() => {});
        return;
      }
      setIsPlaying(false);
      setIsBuffering(false);
      deactivateAudioAnchor();
      stopProgressTimer();
    };

    audio.onwaiting = () => {
      setIsBuffering(true);
    };

    audio.onplaying = () => {
      setIsBuffering(false);
    };

    audio.ontimeupdate = () => {
      if (audio.currentTime) {
        setCurrentTime(audio.currentTime);
        currentTimeRef.current = audio.currentTime;
      }
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0 && isFinite(audio.duration)) {
        setDuration(audio.duration);
        durationRef.current = audio.duration;
      }
    };

    audio.onended = () => {
      const cur = audio.currentTime || 0;
      const dur = audio.duration || 0;
      if (dur > 25 && cur < dur - 5) {
        audio.currentTime = cur;
        audio.play().catch(() => {});
        return;
      }
      handleTrackEndedRef.current();
    };

    audio.onerror = (e) => {
      console.warn("Audio stream notice, ensuring YT fallback if needed:", e);
      setIsBuffering(false);
      const activeTrack = currentTrackRef.current;
      if (activeTrack && !isUserPausedRef.current) {
        const vidId = activeTrack.youtubeId || activeTrack.id;
        if (vidId && !vidId.startsWith('sp_') && ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          try {
            audio.pause();
            audio.removeAttribute('src');
            ytPlayerRef.current.loadVideoById({
              videoId: vidId,
              startSeconds: currentTimeRef.current || 0,
              suggestedQuality: 'small'
            });
          } catch {}
        }
      }
    };

    htmlAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [activateAudioAnchor, deactivateAudioAnchor]);

  const startProgressTimer = () => {
    stopProgressTimer();
    progressTimerRef.current = setInterval(() => {
      if (htmlAudioRef.current && htmlAudioRef.current.src && !htmlAudioRef.current.paused) {
        const cur = htmlAudioRef.current.currentTime || 0;
        const dur = htmlAudioRef.current.duration || 0;
        setCurrentTime(cur);
        if (dur > 0 && !isNaN(dur) && isFinite(dur)) {
          setDuration(dur);
          if ('mediaSession' in navigator && typeof navigator.mediaSession.setPositionState === 'function') {
            try {
              navigator.mediaSession.setPositionState({
                duration: Math.max(0, dur),
                playbackRate: 1,
                position: Math.min(dur, Math.max(0, cur))
              });
            } catch {}
          }
        }
      } else if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        const cur = ytPlayerRef.current.getCurrentTime() || 0;
        const dur = ytPlayerRef.current.getDuration() || 0;
        if (cur > 0) setCurrentTime(cur);
        if (dur > 0 && isFinite(dur)) {
          setDuration(dur);
          if ('mediaSession' in navigator && typeof navigator.mediaSession.setPositionState === 'function') {
            try {
              navigator.mediaSession.setPositionState({
                duration: Math.max(0, dur),
                playbackRate: 1,
                position: Math.min(dur, Math.max(0, cur))
              });
            } catch {}
          }
        }
      }
    }, 250);
  };

  const stopProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    if (!track || !track.id) return;

    isUserPausedRef.current = false;
    wasPlayingBeforeHiddenRef.current = true;
    preloadedStreamUrlRef.current = null;

    setCurrentTrack(track);
    currentTrackRef.current = track;
    setCurrentTime(0);
    currentTimeRef.current = 0;
    setDuration(track.durationSeconds || 0);
    durationRef.current = track.durationSeconds || 0;

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      queueRef.current = newQueue;
      const idx = newQueue.findIndex(t => t.id === track.id);
      const validIdx = idx >= 0 ? idx : 0;
      setQueueIndex(validIdx);
      queueIndexRef.current = validIdx;
    } else {
      const currentQ = queueRef.current;
      const idx = currentQ.findIndex(t => t.id === track.id);
      if (idx >= 0) {
        setQueueIndex(idx);
        queueIndexRef.current = idx;
      } else {
        const updated = [track, ...currentQ];
        setQueue(updated);
        queueRef.current = updated;
        setQueueIndex(0);
        queueIndexRef.current = 0;
      }
    }

    // Add to history & cache in IndexedDB per active account
    const uid = user ? user.uid : 'guest';
    addUserHistory(uid, track);
    cacheTrackForOffline(track);
    getUserHistory(uid).then(setHistory);

    const rawAppleId = track.appleSongId || (track.id.startsWith('apple_') ? track.id.replace('apple_', '') : null);

    if (track.source === 'apple' || track.isDrmProtected || track.id.startsWith('apple_')) {
      const appleId = rawAppleId || track.id.replace('apple_', '');
      setAppleSongId(appleId);

      try {
        ytPlayerRef.current?.pauseVideo?.();
        ytPlayerRef.current?.stopVideo?.();
      } catch {}

      setSpotifyTrackId(null);
      isSpotifyPlayingRef.current = false;
      stopProgressTimer();

      setIsBuffering(true);
      setAppleDrmStatus('authenticating');

      playAppleDrmSong(appleId).then((success) => {
        setIsBuffering(false);
        if (success) {
          setIsAppleDrmActive(true);
          setAppleDrmStatus('drm_playing');
          setIsPlaying(true);
          isUserPausedRef.current = false;
          activateAudioAnchor();
          initWebAudioAtmos();
        } else {
          setIsAppleDrmActive(false);
          setAppleDrmStatus('drm_ready');
          if (htmlAudioRef.current && track.audioUrl) {
            htmlAudioRef.current.pause();
            htmlAudioRef.current.src = track.audioUrl;
            htmlAudioRef.current.volume = isMutedRef.current ? 0 : volumeRef.current;
            htmlAudioRef.current.play().catch(e => {
              console.warn("Direct audio playback notice:", e);
            });
            setIsPlaying(true);
            isUserPausedRef.current = false;
            activateAudioAnchor();
            initWebAudioAtmos();
          }
        }
      }).catch((e) => {
        setIsBuffering(false);
        console.warn("MusicKit DRM player exception, fallback to direct audio:", e);
        setIsAppleDrmActive(false);
        setAppleDrmStatus('drm_ready');
        if (htmlAudioRef.current && track.audioUrl) {
          htmlAudioRef.current.pause();
          htmlAudioRef.current.src = track.audioUrl;
          htmlAudioRef.current.volume = isMutedRef.current ? 0 : volumeRef.current;
          htmlAudioRef.current.play().catch(() => {});
          setIsPlaying(true);
          isUserPausedRef.current = false;
          activateAudioAnchor();
          initWebAudioAtmos();
        }
      });
      setCurrentTime(0);
      setDuration(track.durationSeconds || 240);
    } else if (track.audioUrl || track.source === 'vanz' || track.source === 'cloudinary') {
      try {
        ytPlayerRef.current?.pauseVideo?.();
        ytPlayerRef.current?.stopVideo?.();
      } catch {}

      setSpotifyTrackId(null);
      isSpotifyPlayingRef.current = false;
      setIsAppleDrmActive(false);
      setAppleSongId(null);
      stopProgressTimer();

      if (htmlAudioRef.current && track.audioUrl) {
        preloadedStreamUrlRef.current = track.audioUrl;
        htmlAudioRef.current.pause();
        htmlAudioRef.current.src = track.audioUrl;
        htmlAudioRef.current.volume = isMutedRef.current ? 0 : volumeRef.current;
        htmlAudioRef.current.play().catch(e => {
          console.warn("Audio play prevented or error:", e);
        });
      }
      setIsPlaying(true);
      isUserPausedRef.current = false;
      setCurrentTime(0);
      setDuration(track.durationSeconds || 240);
      activateAudioAnchor();
      initWebAudioAtmos();
    } else {
      // Standard track (from user's server or Spotify/YouTube):
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
        htmlAudioRef.current.removeAttribute('src');
      }
      setSpotifyTrackId(null);
      isSpotifyPlayingRef.current = false;
      setIsAppleDrmActive(false);
      setAppleSongId(null);

      // Resolve real YouTube/server videoId if it's a Spotify-prefixed track
      let targetVideoId = track.youtubeId || track.id;
      if (targetVideoId.startsWith('sp_')) {
        try {
          targetVideoId = await resolveFullAudioId(track);
        } catch {}
      }

      // Pre-fetch direct audio stream URL from user's server (/api/proxy/stream) in parallel
      // If page is currently hidden/locked OR once direct audio stream is ready, we can use native HTML5 Audio
      // so lock screen and background playback never get paused by mobile browsers!
      fetch(`/api/proxy/stream?id=${encodeURIComponent(targetVideoId)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const streamUrl = data?.urlAudioMurni || data?.url;
          if (streamUrl && !streamUrl.includes('SoundHelix') && currentTrackRef.current?.id === track.id) {
            preloadedStreamUrlRef.current = streamUrl;
            // If app is already in background / lock screen, switch immediately to native HTML5 audio
            if (document.hidden && htmlAudioRef.current && !isUserPausedRef.current) {
              const cur = ytPlayerRef.current?.getCurrentTime?.() || currentTimeRef.current || 0;
              try { ytPlayerRef.current?.pauseVideo?.(); } catch {}
              htmlAudioRef.current.src = streamUrl;
              htmlAudioRef.current.currentTime = cur > 1 ? cur : 0;
              htmlAudioRef.current.volume = isMutedRef.current ? 0 : volumeRef.current;
              htmlAudioRef.current.play().catch(() => {});
            }
          }
        })
        .catch(() => {});

      if (document.hidden) {
        // When starting a track while screen is locked or app is in background (e.g. auto-advance to next song on lock screen),
        // play via native HTML5 Audio first if possible, and also trigger YT player
        const streamed = await fallbackToServerAudioStream({ ...track, youtubeId: targetVideoId }, 0);
        if (!streamed && ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          ytPlayerRef.current.loadVideoById({
            videoId: targetVideoId,
            suggestedQuality: 'small'
          });
        }
        setIsPlaying(true);
        activateAudioAnchor();
        initWebAudioAtmos();
      } else if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        ytPlayerRef.current.loadVideoById({
          videoId: targetVideoId,
          suggestedQuality: 'small'
        });
        setIsPlaying(true);
        isUserPausedRef.current = false;
        activateAudioAnchor();
        initWebAudioAtmos();
      } else {
        fallbackToServerAudioStream({ ...track, youtubeId: targetVideoId }, 0);
      }
    }

    // Fetch genuine real-time synced lyrics
    setIsLoadingLyrics(true);
    try {
      const result = await fetchRealTrackLyrics(
        track.title, 
        track.artist, 
        track.id, 
        track.durationSeconds || 210
      );
      setLyricsResult(result);
      setLyrics(result.lyrics || []);
    } catch (err) {
      console.warn("Failed to fetch real lyrics:", err);
      setLyricsResult(null);
      setLyrics([]);
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  const reloadLyrics = async () => {
    if (!currentTrack) return;
    setIsLoadingLyrics(true);
    try {
      const result = await fetchRealTrackLyrics(
        currentTrack.title, 
        currentTrack.artist, 
        currentTrack.id, 
        currentTrack.durationSeconds || 210
      );
      setLyricsResult(result);
      setLyrics(result.lyrics || []);
    } catch {
      // ignore
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  const updateLyricsResult = (result: LyricsResult) => {
    setLyricsResult(result);
    setLyrics(result.lyrics || []);
  };

  const togglePlay = () => {
    if (!currentTrack) {
      if (queueRef.current.length > 0) {
        playTrack(queueRef.current[0]);
      }
      return;
    }

    if (isAppleDrmActive) {
      if (isPlaying) {
        pauseAppleDrm();
        setIsPlaying(false);
        isUserPausedRef.current = true;
        deactivateAudioAnchor();
      } else {
        resumeAppleDrm();
        setIsPlaying(true);
        isUserPausedRef.current = false;
        activateAudioAnchor();
      }
      return;
    }

    if (isPlaying) {
      isUserPausedRef.current = true;
      wasPlayingBeforeHiddenRef.current = false;
      isSpotifyPlayingRef.current = false;
      if (htmlAudioRef.current && htmlAudioRef.current.src) {
        htmlAudioRef.current.pause();
      }
      if (ytPlayerRef.current) {
        ytPlayerRef.current?.pauseVideo?.();
      }
      setIsPlaying(false);
      deactivateAudioAnchor();
      stopProgressTimer();
    } else {
      isUserPausedRef.current = false;
      wasPlayingBeforeHiddenRef.current = true;
      if (htmlAudioRef.current && htmlAudioRef.current.src) {
        htmlAudioRef.current.play().catch(() => {});
      } else if (ytPlayerRef.current) {
        ytPlayerRef.current?.playVideo?.();
      }
      setIsPlaying(true);
      activateAudioAnchor();
      initWebAudioAtmos();
      startProgressTimer();
    }
  };

  const playNext = useCallback(() => {
    const activeQueue = queueRef.current;
    const activeIdx = queueIndexRef.current;
    const activeRepeat = repeatModeRef.current;
    const activeShuffle = isShuffleRef.current;
    const activeTrack = currentTrackRef.current;

    if (activeQueue.length === 0) return;

    if (activeRepeat === 'one' && activeTrack) {
      seekTo(0);
      if (htmlAudioRef.current && htmlAudioRef.current.src) {
        htmlAudioRef.current.play().catch(() => {});
      } else if (ytPlayerRef.current) {
        ytPlayerRef.current?.playVideo?.();
      }
      return;
    }

    let nextIndex = activeIdx + 1;
    if (activeShuffle && activeQueue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * activeQueue.length);
      } while (nextIndex === activeIdx);
    } else if (nextIndex >= activeQueue.length) {
      if (activeRepeat === 'all') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    setQueueIndex(nextIndex);
    queueIndexRef.current = nextIndex;
    playTrack(activeQueue[nextIndex]);
  }, []);

  const playPrevious = useCallback(() => {
    const activeQueue = queueRef.current;
    const activeIdx = queueIndexRef.current;
    if (activeQueue.length === 0) return;

    if (currentTimeRef.current > 4) {
      seekTo(0);
      return;
    }
    let prevIndex = activeIdx - 1;
    if (prevIndex < 0) {
      prevIndex = activeQueue.length - 1;
    }
    setQueueIndex(prevIndex);
    queueIndexRef.current = prevIndex;
    playTrack(activeQueue[prevIndex]);
  }, []);

  const handleTrackEnded = useCallback(() => {
    if (repeatModeRef.current === 'one') {
      seekTo(0);
      if (htmlAudioRef.current && htmlAudioRef.current.src) {
        htmlAudioRef.current.play().catch(() => {});
      } else if (ytPlayerRef.current) {
        ytPlayerRef.current?.playVideo?.();
      }
    } else {
      playNext();
    }
  }, [playNext]);

  useEffect(() => {
    handleTrackEndedRef.current = handleTrackEnded;
  }, [handleTrackEnded]);

  const seekTo = (seconds: number) => {
    setCurrentTime(seconds);
    currentTimeRef.current = seconds;
    spotifyCurrentTimeRef.current = seconds;
    if (isAppleDrmActive) {
      seekAppleDrm(seconds);
    }
    if (htmlAudioRef.current && htmlAudioRef.current.src) {
      try {
        htmlAudioRef.current.currentTime = seconds;
      } catch {}
    } else if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(seconds, true);
    }
  };

  // Detect Apple Music DRM capabilities (FairPlay / Widevine) & subscribe to MusicKit events
  useEffect(() => {
    detectDrmCapabilities().then((sys) => {
      if (sys === 'fairplay') {
        setDrmSystemName('Apple FairPlay Streaming DRM');
      } else if (sys === 'widevine') {
        setDrmSystemName('Widevine Modular DRM');
      } else {
        setDrmSystemName('Apple Web DRM');
      }
    });

    const unsub = subscribeAppleDrmListeners({
      onStateChange: (playing, state) => {
        setIsPlaying(playing);
        setIsBuffering(state === 'waiting' || state === 'loading');
      },
      onTimeChange: (cur, dur) => {
        if (cur > 0) setCurrentTime(cur);
        if (dur > 0 && !isNaN(dur)) setDuration(dur);
      },
      onTrackEnd: () => {
        playNext();
      },
      onError: (err) => {
        console.warn("MusicKit DRM player notice:", err);
      }
    });

    return () => unsub();
  }, [playNext]);

  // Sync MediaSession metadata (Title, Artist, Album, Cover Art, Playback State)
  const updateMediaSession = useCallback((track: Track | null, playing: boolean) => {
    if (!('mediaSession' in navigator) || !track) return;

    try {
      const thumb = track.thumbnail || 'https://res.cloudinary.com/d8cvicyr/image/upload/v1791624588/Desain_tanpa_judul__1_-removebg-preview.png';
      const artwork = [
        { src: thumb, sizes: '96x96', type: 'image/jpeg' },
        { src: thumb, sizes: '128x128', type: 'image/jpeg' },
        { src: thumb, sizes: '192x192', type: 'image/jpeg' },
        { src: thumb, sizes: '256x256', type: 'image/jpeg' },
        { src: thumb, sizes: '512x512', type: 'image/jpeg' },
      ];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist || 'VanzMusic',
        album: 'VanzMusic',
        artwork
      });

      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    } catch (e) {
      console.warn("MediaSession update error:", e);
    }
  }, []);

  useEffect(() => {
    updateMediaSession(currentTrack, isPlaying);
  }, [currentTrack, isPlaying, updateMediaSession]);

  // MediaSession Action Handlers (Notification center, lock screen & bluetooth controls on mobile & desktop)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        isUserPausedRef.current = false;
        wasPlayingBeforeHiddenRef.current = true;
        if (htmlAudioRef.current && htmlAudioRef.current.src) {
          htmlAudioRef.current.play().catch(() => {});
        } else if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
          ytPlayerRef.current.playVideo();
        }
        setIsPlaying(true);
        activateAudioAnchor();
        startProgressTimer();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        isUserPausedRef.current = true;
        wasPlayingBeforeHiddenRef.current = false;
        if (htmlAudioRef.current && htmlAudioRef.current.src) {
          htmlAudioRef.current.pause();
        }
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        }
        setIsPlaying(false);
        deactivateAudioAnchor();
        stopProgressTimer();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPrevious();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNext();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          seekTo(details.seekTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skip = details.seekOffset || 10;
        seekTo(Math.max(0, currentTimeRef.current - skip));
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skip = details.seekOffset || 10;
        seekTo(Math.min(durationRef.current, currentTimeRef.current + skip));
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        isUserPausedRef.current = true;
        wasPlayingBeforeHiddenRef.current = false;
        if (htmlAudioRef.current && htmlAudioRef.current.src) {
          htmlAudioRef.current.pause();
        }
        if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
          ytPlayerRef.current.stopVideo();
        }
        setIsPlaying(false);
        deactivateAudioAnchor();
        stopProgressTimer();
      });
    } catch (e) {
      console.warn("MediaSession action handler error:", e);
    }
  }, [playPrevious, playNext, activateAudioAnchor, deactivateAudioAnchor]);

  // Background audio keepalive & seamless handoff when browser is minimized, closed to background, or screen is locked
  useEffect(() => {
    const keepPlayingInBackground = () => {
      if (isUserPausedRef.current || !currentTrackRef.current) return;

      if (isPlayingRef.current || wasPlayingBeforeHiddenRef.current) {
        wasPlayingBeforeHiddenRef.current = true;
        activateAudioAnchor();

        // If HTML5 audio is already playing, ensure it stays playing
        if (htmlAudioRef.current && htmlAudioRef.current.src) {
          if (htmlAudioRef.current.paused) {
            htmlAudioRef.current.play().catch(() => {});
          }
          return;
        }

        // If we have a preloaded direct audio stream URL from the server, hand off seamlessly when hidden/locked
        if (document.hidden && preloadedStreamUrlRef.current && htmlAudioRef.current) {
          const curTime = ytPlayerRef.current?.getCurrentTime?.() || currentTimeRef.current || 0;
          try {
            ytPlayerRef.current?.pauseVideo?.();
          } catch {}
          htmlAudioRef.current.src = preloadedStreamUrlRef.current;
          htmlAudioRef.current.currentTime = curTime > 1 ? curTime : 0;
          htmlAudioRef.current.volume = isMutedRef.current ? 0 : volumeRef.current;
          htmlAudioRef.current.play().catch(() => {
            try { ytPlayerRef.current?.playVideo?.(); } catch {}
          });
          setIsPlaying(true);
          return;
        }

        // Also keep YouTube player active if HTML5 stream isn't active yet
        setTimeout(() => {
          if (!isUserPausedRef.current && ytPlayerRef.current) {
            try {
              const state = ytPlayerRef.current.getPlayerState?.();
              if (state !== 1) {
                ytPlayerRef.current.playVideo?.();
              }
            } catch {}
          }
        }, 80);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        keepPlayingInBackground();
      } else {
        // App returned to foreground
        if (wasPlayingBeforeHiddenRef.current && !isUserPausedRef.current) {
          activateAudioAnchor();
          if (htmlAudioRef.current && htmlAudioRef.current.src) {
            if (htmlAudioRef.current.paused) {
              htmlAudioRef.current.play().catch(() => {});
            }
            setIsPlaying(true);
          } else if (ytPlayerRef.current) {
            try {
              const state = ytPlayerRef.current.getPlayerState?.();
              if (state === 2 || state === 5 || state === -1) {
                ytPlayerRef.current.playVideo?.();
                setIsPlaying(true);
              }
            } catch {}
          }
        }
      }
    };

    // Periodic background watchdog timer to ensure mobile OS never suspends audio pipeline
    const watchdogInterval = setInterval(() => {
      if (document.hidden && wasPlayingBeforeHiddenRef.current && !isUserPausedRef.current) {
        activateAudioAnchor();
        if (htmlAudioRef.current && htmlAudioRef.current.src && htmlAudioRef.current.paused) {
          htmlAudioRef.current.play().catch(() => {});
        } else if ((!htmlAudioRef.current || !htmlAudioRef.current.src) && ytPlayerRef.current) {
          try {
            const state = ytPlayerRef.current.getPlayerState?.();
            if (state === 2) {
              ytPlayerRef.current.playVideo?.();
            }
          } catch {}
        }
      }
    }, 1500);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', keepPlayingInBackground);
    window.addEventListener('freeze', keepPlayingInBackground);
    window.addEventListener('blur', keepPlayingInBackground);

    return () => {
      clearInterval(watchdogInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', keepPlayingInBackground);
      window.removeEventListener('freeze', keepPlayingInBackground);
      window.removeEventListener('blur', keepPlayingInBackground);
    };
  }, [activateAudioAnchor]);

  // Screen Wake Lock API while playing in foreground
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isPlaying && !document.hidden) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch {}
      }
    };
    requestWakeLock();
    return () => {
      wakeLock?.release?.().catch(() => {});
    };
  }, [isPlaying]);

  const setVolume = (val: number) => {
    setVolumeState(val);
    setAppleDrmVolume(val);
    if (val === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
    if (htmlAudioRef.current) {
      htmlAudioRef.current.volume = val;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(Math.round(val * 100));
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setAppleDrmVolume(volume);
      if (htmlAudioRef.current) {
        htmlAudioRef.current.muted = false;
        htmlAudioRef.current.volume = volume;
      }
      ytPlayerRef.current?.unMute?.();
      ytPlayerRef.current?.setVolume?.(Math.round(volume * 100));
    } else {
      setIsMuted(true);
      setAppleDrmVolume(0);
      if (htmlAudioRef.current) {
        htmlAudioRef.current.muted = true;
      }
      ytPlayerRef.current?.mute?.();
    }
  };

  const toggleShuffle = () => setIsShuffle(prev => !prev);

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const addToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
  };

  // Favorites management (Scoped to Active Account)
  const isFavorite = (trackId: string) => {
    return favorites.some(t => t.id === trackId);
  };

  const toggleFavoriteAction = async (track: Track) => {
    const uid = user ? user.uid : 'guest';
    const isCurrentlyFav = favorites.some(t => t.id === track.id);
    await toggleUserFavorite(uid, track);
    const updated = await getUserFavorites(uid);
    setFavorites(updated);
    // Sync community global like count
    try {
      await toggleSongLikeCount(track, !isCurrentlyFav);
    } catch {}
  };

  // Admin role check strictly for 'support.vanzmusicid@gmail.com'
  const isAdmin = isUserAdmin(user);

  const boostSongLikesAction = async (
    track: Track | { id: string; title: string; artist: string; thumbnail?: string }, 
    amount: number
  ) => {
    return await adminBoostSongLikes(user, track, amount);
  };

  // Playlists management (Scoped to Active Account)
  const refreshPlaylists = async () => {
    const uid = user ? user.uid : 'guest';
    const pl = await getUserPlaylists(uid);
    setPlaylists(pl);
  };

  const createPlaylist = async (name: string, description?: string): Promise<Playlist> => {
    const uid = user ? user.uid : 'guest';
    const newPlaylist: Playlist = {
      id: `pl-${uid}-${Date.now()}`,
      name,
      description,
      coverImage: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg',
      tracks: [],
      createdAt: Date.now(),
      isCustom: true
    };
    await saveUserPlaylist(uid, newPlaylist);
    await refreshPlaylists();
    return newPlaylist;
  };

  const addSongToPlaylistAction = async (playlistId: string, track: Track) => {
    const uid = user ? user.uid : 'guest';
    await addTrackToUserPlaylist(uid, playlistId, track);
    await refreshPlaylists();
  };

  const removeSongFromPlaylistAction = async (playlistId: string, trackId: string) => {
    const uid = user ? user.uid : 'guest';
    await removeTrackFromUserPlaylist(uid, playlistId, trackId);
    await refreshPlaylists();
  };

  const deletePlaylistAction = async (playlistId: string) => {
    const uid = user ? user.uid : 'guest';
    await deleteUserPlaylist(uid, playlistId);
    await refreshPlaylists();
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        queueIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        isFullPlayerOpen,
        isLyricsOpen,
        isVideoMode,
        lyrics,
        lyricsResult,
        isLoadingLyrics,
        isBuffering,
        reloadLyrics,
        updateLyricsResult,

        playTrack,
        togglePlay,
        playNext,
        playPrevious,
        seekTo,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        setFullPlayerOpen,
        setLyricsOpen,
        setVideoMode,
        addToQueue,

        favorites,
        isFavorite,
        toggleFavoriteAction,
        playlists,
        refreshPlaylists,
        createPlaylist,
        addSongToPlaylistAction,
        removeSongFromPlaylistAction,
        deletePlaylistAction,
        history,

        activeTab,
        setActiveTab,
        isDarkMode,
        toggleDarkMode,
        themeMode,
        setThemeMode,

        user,
        isAdmin,
        adminEmail: ADMIN_EMAIL,
        isAuthLoading,
        signInWithGoogleAction,
        registerWithEmailAction,
        loginWithEmailAction,
        updateUserProfileAction,
        signInWithGuestProfile,
        signOutAction,
        boostSongLikesAction,

        ytContainerId,
        themeColor: currentPalette.color,
        themeGlow: currentPalette.glow,

        isBottomBarsVisible,
        setIsBottomBarsVisible,

        isDolbyAtmos,
        toggleDolbyAtmos,
        dolbyMode,
        setDolbyMode,
        isDolbyModalOpen,
        setDolbyModalOpen,

        isSpotifyMode,
        setSpotifyMode,
        spotifyTrackId,
        spotifyUser,
        spotifyToken,
        loginWithSpotifyAction,
        logoutSpotifyAction,

        isAppleDrmActive,
        appleDrmStatus,
        drmSystemName,
        isAppleEmbedOpen,
        setAppleEmbedOpen,
        appleSongId,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
