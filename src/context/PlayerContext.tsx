import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { LyricLine, LyricsResult, Playlist, RepeatMode, Track, ViewTab } from '../types';
import { 
  getLocalFavorites, 
  getLocalPlaylists, 
  saveLocalPlaylist, 
  deleteLocalPlaylist, 
  toggleLocalFavorite, 
  addTrackToPlaylist, 
  removeTrackFromPlaylist,
  getLocalHistory,
  addLocalHistory,
  cacheTrackForOffline
} from '../lib/indexedDB';
import { FALLBACK_TRENDING_TRACKS } from '../lib/youtube';
import { fetchRealTrackLyrics } from '../lib/lyricsService';
import { auth, loginWithGoogle, logoutUser, onAuthStateChanged, User } from '../lib/firebase';

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

  // Personal Library & Playlists (IndexedDB)
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

  // Firebase Auth
  user: User | null;
  isAuthLoading: boolean;
  signInWithGoogleAction: () => Promise<void>;
  signOutAction: () => Promise<void>;

  // Player Container Ref for embedded YouTube iframe
  ytContainerId: string;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

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

  // IndexedDB state
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [history, setHistory] = useState<Track[]>([]);

  // Navigation and Theme
  const [activeTab, setActiveTab] = useState<ViewTab>('search');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return true;
  });

  // Firebase Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // YouTube Player instance
  const ytPlayerRef = useRef<any>(null);
  const ytContainerId = 'vanz-yt-player';
  const progressTimerRef = useRef<any>(null);

  // Initialize Theme class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vanz_music_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vanz_music_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Initialize Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogleAction = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Google sign in failed:", err);
    }
  };

  const signOutAction = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // Load IndexedDB data on start
  const loadLocalData = useCallback(async () => {
    try {
      const [favs, pl, hist] = await Promise.all([
        getLocalFavorites(),
        getLocalPlaylists(),
        getLocalHistory()
      ]);
      setFavorites(favs);
      setPlaylists(pl);
      setHistory(hist);
    } catch (err) {
      console.error("Failed to load local DB data:", err);
    }
  }, []);

  useEffect(() => {
    loadLocalData();
  }, [loadLocalData]);

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
              // Auto advance on unplayable video
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

  // Time progress poller
  const startProgressTimer = () => {
    stopProgressTimer();
    progressTimerRef.current = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        try {
          const cur = ytPlayerRef.current.getCurrentTime() || 0;
          const dur = ytPlayerRef.current.getDuration() || 0;
          setCurrentTime(cur);
          if (dur > 0) setDuration(dur);
        } catch {
          // ignore
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

  // Background play & WakeLock / Visibility change handling
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      if (isPlaying && 'wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch {
          // ignore
        }
      }
    };

    if (isPlaying) {
      requestWakeLock();
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && isPlaying && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.playVideo?.();
        } catch {
          // ignore
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isPlaying]);

  // MediaSession API setup for Background & Lock Screen Control
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: 'vanz music (beta testing)',
          artwork: [
            { src: currentTrack.thumbnail, sizes: '96x96', type: 'image/jpeg' },
            { src: currentTrack.thumbnail, sizes: '128x128', type: 'image/jpeg' },
            { src: currentTrack.thumbnail, sizes: '192x192', type: 'image/jpeg' },
            { src: currentTrack.thumbnail, sizes: '256x256', type: 'image/jpeg' },
            { src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' },
          ]
        });

        navigator.mediaSession.setActionHandler('play', () => {
          if (ytPlayerRef.current?.playVideo) {
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
          }
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          if (ytPlayerRef.current?.pauseVideo) {
            ytPlayerRef.current.pauseVideo();
            setIsPlaying(false);
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
          const skipTime = details.seekOffset || 10;
          seekTo(Math.max(currentTime - skipTime, 0));
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          const skipTime = details.seekOffset || 10;
          seekTo(Math.min(currentTime + skipTime, duration));
        });
      } catch (e) {
        console.warn('MediaSession handler error:', e);
      }
    }
  }, [currentTrack, currentTime, duration]);

  // Track playback and lyrics fetching
  const playTrack = async (track: Track, newQueue?: Track[]) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setIsBuffering(true);

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

    // Add to history & cache in IndexedDB
    addLocalHistory(track);
    cacheTrackForOffline(track);
    getLocalHistory().then(setHistory);

    // Load video in YouTube player
    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      ytPlayerRef.current.loadVideoById({
        videoId: track.id,
        suggestedQuality: 'small'
      });
      setIsPlaying(true);
    }

    // Fetch genuine real-time synced lyrics from authentic sources
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

  // Favorites management
  const isFavorite = (trackId: string) => {
    return favorites.some(t => t.id === trackId);
  };

  const toggleFavoriteAction = async (track: Track) => {
    await toggleLocalFavorite(track);
    const updated = await getLocalFavorites();
    setFavorites(updated);
  };

  // Playlists management
  const refreshPlaylists = async () => {
    const pl = await getLocalPlaylists();
    setPlaylists(pl);
  };

  const createPlaylist = async (name: string, description?: string): Promise<Playlist> => {
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      description,
      coverImage: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg',
      tracks: [],
      createdAt: Date.now(),
      isCustom: true
    };
    await saveLocalPlaylist(newPlaylist);
    await refreshPlaylists();
    return newPlaylist;
  };

  const addSongToPlaylistAction = async (playlistId: string, track: Track) => {
    await addTrackToPlaylist(playlistId, track);
    await refreshPlaylists();
  };

  const removeSongFromPlaylistAction = async (playlistId: string, trackId: string) => {
    await removeTrackFromPlaylist(playlistId, trackId);
    await refreshPlaylists();
  };

  const deletePlaylistAction = async (playlistId: string) => {
    await deleteLocalPlaylist(playlistId);
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

        user,
        isAuthLoading,
        signInWithGoogleAction,
        signOutAction,

        ytContainerId
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
