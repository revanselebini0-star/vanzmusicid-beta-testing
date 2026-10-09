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
import { DEFAULT_SPOTIFY_TRACKS, resolveFullAudioId } from '../lib/spotify';
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

  // Activate audio session anchor (keeps mobile OS audio pipeline open)
  const activateAudioAnchor = useCallback(() => {
    try {
      if (silentAudioRef.current) {
        const p = silentAudioRef.current.play();
        if (p !== undefined) {
          p.catch(() => {});
        }
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
      audio.volume = 0.001; // subtle volume so mobile OS registers active output session
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
              // YT.PlayerState.PLAYING = 1, PAUSED = 2, BUFFERING = 3, ENDED = 0
              if (event.data === 1) {
                setIsPlaying(true);
                setIsBuffering(false);
                isUserPausedRef.current = false;
                activateAudioAnchor();
                startProgressTimer();
              } else if (event.data === 2) {
                // If paused while page is hidden (minimized/backgrounded) and user didn't request pause,
                // auto-resume immediately so music keeps playing in background on mobile!
                if (document.hidden && !isUserPausedRef.current && wasPlayingBeforeHiddenRef.current) {
                  setTimeout(() => {
                    if (!isUserPausedRef.current && ytPlayerRef.current) {
                      try {
                        ytPlayerRef.current.playVideo?.();
                      } catch {}
                    }
                  }, 80);
                  return;
                }

                setIsPlaying(false);
                setIsBuffering(false);
                deactivateAudioAnchor();
                stopProgressTimer();
              } else if (event.data === 3) {
                setIsBuffering(true);
              } else if (event.data === 0) {
                handleTrackEnded();
              }
            },
            onError: (err: any) => {
              console.warn("YouTube Player error:", err);
              setIsBuffering(false);
              setTimeout(() => playNext(), 1500);
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

  // Native HTML5 Audio instance for Apple Music Direct Streams
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';

    audio.onplay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      isUserPausedRef.current = false;
      activateAudioAnchor();
      startProgressTimer();
    };

    audio.onpause = () => {
      if (!isUserPausedRef.current && document.hidden && wasPlayingBeforeHiddenRef.current) {
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
      }
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    audio.onended = () => {
      handleTrackEnded();
    };

    audio.onerror = (e) => {
      console.warn("Apple Music audio stream notice:", e);
      setIsBuffering(false);
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
      if (isSpotifyMode || isSpotifyPlayingRef.current) {
        spotifyCurrentTimeRef.current += 0.25;
        const cur = spotifyCurrentTimeRef.current;
        const dur = currentTrack?.durationSeconds || 210;
        setCurrentTime(cur);
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
        if (cur >= dur) {
          handleTrackEnded();
        }
      } else if (htmlAudioRef.current && htmlAudioRef.current.src && !htmlAudioRef.current.paused) {
        const cur = htmlAudioRef.current.currentTime || 0;
        const dur = htmlAudioRef.current.duration || 0;
        setCurrentTime(cur);
        if (dur > 0 && !isNaN(dur)) {
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
        setCurrentTime(cur);
        if (dur > 0) {
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
    }, 100);
  };

  const stopProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    if (!track || !track.id) return;

    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(track.durationSeconds || 0);

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const idx = newQueue.findIndex(t => t.id === track.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    } else {
      const idx = queue.findIndex(t => t.id === track.id);
      if (idx >= 0) {
        setQueueIndex(idx);
      } else {
        const updated = [track, ...queue];
        setQueue(updated);
        setQueueIndex(0);
      }
    }

    // Add to history & cache in IndexedDB per active account
    const uid = user ? user.uid : 'guest';
    addUserHistory(uid, track);
    cacheTrackForOffline(track);
    getUserHistory(uid).then(setHistory);

    // Play via Apple Music DRM (FairPlay / Widevine), Direct Audio, Spotify Direct, or YouTube
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

      // Trigger Apple Music DRM playback (FairPlay / Widevine) via MusicKit JS
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
          // Seamless fallback to high-definition AAC preview stream
          setIsAppleDrmActive(false);
          setAppleDrmStatus('drm_ready');
          if (htmlAudioRef.current && track.audioUrl) {
            htmlAudioRef.current.pause();
            htmlAudioRef.current.src = track.audioUrl;
            htmlAudioRef.current.volume = isMuted ? 0 : volume;
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
          htmlAudioRef.current.volume = isMuted ? 0 : volume;
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
        htmlAudioRef.current.pause();
        htmlAudioRef.current.src = track.audioUrl;
        htmlAudioRef.current.volume = isMuted ? 0 : volume;
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
    } else if (isSpotifyMode || track.source === 'spotify' || track.id.startsWith('sp_')) {
      try {
        ytPlayerRef.current?.pauseVideo?.();
        ytPlayerRef.current?.stopVideo?.();
      } catch {}
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
        htmlAudioRef.current.src = '';
      }

      const spId = track.id.startsWith('sp_') ? track.id.replace('sp_', '') : track.id;
      setSpotifyTrackId(spId);
      setIsPlaying(true);
      isSpotifyPlayingRef.current = true;
      spotifyCurrentTimeRef.current = 0;
      setCurrentTime(0);
      setDuration(track.durationSeconds || 210);
      activateAudioAnchor();
      startProgressTimer();
      initWebAudioAtmos();
    } else if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
        htmlAudioRef.current.src = '';
      }

      ytPlayerRef.current.loadVideoById({
        videoId: track.youtubeId || track.id,
        suggestedQuality: 'small'
      });
      setIsPlaying(true);
      isUserPausedRef.current = false;
      activateAudioAnchor();
      initWebAudioAtmos();
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
      if (queue.length > 0) {
        playTrack(queue[0]);
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
      if (currentTrack.audioUrl && htmlAudioRef.current) {
        htmlAudioRef.current.pause();
      } else if (ytPlayerRef.current) {
        ytPlayerRef.current?.pauseVideo?.();
      }
      setIsPlaying(false);
      deactivateAudioAnchor();
      stopProgressTimer();
    } else {
      isUserPausedRef.current = false;
      if (currentTrack.audioUrl && htmlAudioRef.current) {
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
    if (queue.length === 0) return;

    if (repeatMode === 'one' && currentTrack) {
      seekTo(0);
      if (currentTrack.audioUrl && htmlAudioRef.current) {
        htmlAudioRef.current.play().catch(() => {});
      } else if (ytPlayerRef.current) {
        ytPlayerRef.current?.playVideo?.();
      }
      return;
    }

    let nextIndex = queueIndex + 1;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    setQueueIndex(nextIndex);
    playTrack(queue[nextIndex]);
  }, [queue, queueIndex, isShuffle, repeatMode, currentTrack]);

  const playPrevious = () => {
    if (currentTime > 4) {
      seekTo(0);
      return;
    }
    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }
    setQueueIndex(prevIndex);
    playTrack(queue[prevIndex]);
  };

  const handleTrackEnded = () => {
    if (repeatMode === 'one') {
      seekTo(0);
      if (currentTrack?.audioUrl && htmlAudioRef.current) {
        htmlAudioRef.current.play().catch(() => {});
      } else if (ytPlayerRef.current) {
        ytPlayerRef.current?.playVideo?.();
      }
    } else {
      playNext();
    }
  };

  const seekTo = (seconds: number) => {
    setCurrentTime(seconds);
    spotifyCurrentTimeRef.current = seconds;
    if (isAppleDrmActive) {
      seekAppleDrm(seconds);
    }
    if (currentTrack?.audioUrl && htmlAudioRef.current) {
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
      const artwork = [
        { src: track.thumbnail || 'https://cdn.phototourl.com/free/2026-09-19-571b25e0-aa49-47c1-9fa7-8f7127a2a4cd.png', sizes: '96x96', type: 'image/jpeg' },
        { src: track.thumbnail || 'https://cdn.phototourl.com/free/2026-09-19-571b25e0-aa49-47c1-9fa7-8f7127a2a4cd.png', sizes: '128x128', type: 'image/jpeg' },
        { src: track.thumbnail || 'https://cdn.phototourl.com/free/2026-09-19-571b25e0-aa49-47c1-9fa7-8f7127a2a4cd.png', sizes: '192x192', type: 'image/jpeg' },
        { src: track.thumbnail || 'https://cdn.phototourl.com/free/2026-09-19-571b25e0-aa49-47c1-9fa7-8f7127a2a4cd.png', sizes: '256x256', type: 'image/jpeg' },
        { src: track.thumbnail || 'https://cdn.phototourl.com/free/2026-09-19-571b25e0-aa49-47c1-9fa7-8f7127a2a4cd.png', sizes: '512x512', type: 'image/jpeg' },
      ];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist || 'VanzMusic',
        album: 'VanzMusic Online',
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

  // MediaSession Action Handlers (Notification center, lock screen & bluetooth controls on mobile devices)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        isUserPausedRef.current = false;
        if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          activateAudioAnchor();
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        isUserPausedRef.current = true;
        wasPlayingBeforeHiddenRef.current = false;
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
          setIsPlaying(false);
          deactivateAudioAnchor();
        }
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
        seekTo(Math.max(0, currentTime - skip));
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skip = details.seekOffset || 10;
        seekTo(Math.min(duration, currentTime + skip));
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        isUserPausedRef.current = true;
        wasPlayingBeforeHiddenRef.current = false;
        if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
          ytPlayerRef.current.stopVideo();
          setIsPlaying(false);
          deactivateAudioAnchor();
        }
      });
    } catch (e) {
      console.warn("MediaSession action handler error:", e);
    }
  }, [playPrevious, playNext, currentTime, duration, activateAudioAnchor, deactivateAudioAnchor]);

  // Background audio keepalive & auto-resume when browser is minimized or switched to other apps
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App is minimized or user switched to another app (e.g. WhatsApp, Instagram, screen locked)
        if (isPlaying) {
          wasPlayingBeforeHiddenRef.current = true;
          activateAudioAnchor();

          // Force YouTube player to continue playing in background
          setTimeout(() => {
            if (!isUserPausedRef.current && ytPlayerRef.current) {
              try {
                const state = ytPlayerRef.current.getPlayerState?.();
                if (state !== 1) {
                  ytPlayerRef.current.playVideo?.();
                }
              } catch {}
            }
          }, 150);
        }
      } else {
        // App returned to foreground
        if (wasPlayingBeforeHiddenRef.current && !isUserPausedRef.current) {
          wasPlayingBeforeHiddenRef.current = false;
          if (ytPlayerRef.current) {
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

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleVisibilityChange);
    window.addEventListener('blur', () => {
      if (isPlaying) {
        wasPlayingBeforeHiddenRef.current = true;
        activateAudioAnchor();
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleVisibilityChange);
    };
  }, [isPlaying, activateAudioAnchor]);

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
