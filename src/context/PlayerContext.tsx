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
import { FALLBACK_TRENDING_TRACKS } from '../lib/youtube';
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
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>(FALLBACK_TRENDING_TRACKS);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
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

  // YouTube Player instance & Refs
  const ytPlayerRef = useRef<any>(null);
  const ytContainerId = 'vanz-yt-player';
  const progressTimerRef = useRef<any>(null);

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
                startProgressTimer();
              } else if (event.data === 2) {
                setIsPlaying(false);
                setIsBuffering(false);
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
  }, []);

  const startProgressTimer = () => {
    stopProgressTimer();
    progressTimerRef.current = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        const cur = ytPlayerRef.current.getCurrentTime() || 0;
        const dur = ytPlayerRef.current.getDuration() || 0;
        setCurrentTime(cur);
        if (dur > 0) setDuration(dur);
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

    // Load video in YouTube player
    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      ytPlayerRef.current.loadVideoById({
        videoId: track.id,
        suggestedQuality: 'small'
      });
      setIsPlaying(true);
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

    if (isPlaying) {
      ytPlayerRef.current?.pauseVideo?.();
      setIsPlaying(false);
      stopProgressTimer();
    } else {
      ytPlayerRef.current?.playVideo?.();
      setIsPlaying(true);
      startProgressTimer();
    }
  };

  const playNext = useCallback(() => {
    if (queue.length === 0) return;

    if (repeatMode === 'one' && currentTrack) {
      seekTo(0);
      ytPlayerRef.current?.playVideo?.();
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
      ytPlayerRef.current?.playVideo?.();
    } else {
      playNext();
    }
  };

  const seekTo = (seconds: number) => {
    setCurrentTime(seconds);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(seconds, true);
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (val === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(Math.round(val * 100));
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      ytPlayerRef.current?.unMute?.();
      ytPlayerRef.current?.setVolume?.(Math.round(volume * 100));
    } else {
      setIsMuted(true);
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
