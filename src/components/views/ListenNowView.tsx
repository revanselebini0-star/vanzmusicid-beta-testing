import React, { useEffect, useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { Track } from '../../types';
import { getTrendingMusic, FALLBACK_TRENDING_TRACKS } from '../../lib/youtube';
import { 
  Play, 
  Sparkles, 
  Flame, 
  Clock, 
  Heart, 
  Plus, 
  ChevronRight, 
  Radio, 
  Music2,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

interface ListenNowViewProps {
  onOpenPlaylistModal: (track: Track) => void;
}

export const ListenNowView: React.FC<ListenNowViewProps> = ({ onOpenPlaylistModal }) => {
  const { 
    playTrack, 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    favorites, 
    history, 
    toggleFavoriteAction, 
    isFavorite,
    setActiveTab
  } = usePlayer();

  const [trendingTracks, setTrendingTracks] = useState<Track[]>(FALLBACK_TRENDING_TRACKS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadTrending = async () => {
      setIsLoading(true);
      try {
        const tracks = await getTrendingMusic('ID');
        if (isMounted && tracks.length > 0) {
          setTrendingTracks(tracks);
        }
      } catch (err) {
        console.warn("Using fallback trending songs", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadTrending();
    return () => { isMounted = false; };
  }, []);

  const heroTrack = trendingTracks[0] || FALLBACK_TRENDING_TRACKS[0];

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-300">
      {/* Hero Feature Banner */}
      {heroTrack && (
        <section className="relative overflow-hidden rounded-3xl apple-card shadow-2xl border border-black/10 dark:border-white/10 group">
          <div className="absolute inset-0">
            <img
              src={heroTrack.thumbnail}
              alt={heroTrack.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover filter blur-xl scale-125 opacity-60 contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/70 to-transparent" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-xl text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#fa2d48] text-white">
                  Pilihan Editor
                </span>
                <span className="text-xs text-white/70 font-medium">YouTube Trending Music</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2 leading-tight">
                {heroTrack.title}
              </h1>
              <p className="text-sm sm:text-base text-white/80 font-medium mb-6">
                {heroTrack.artist} • {heroTrack.viewCount || 'Populer'}
              </p>

              <div className="flex items-center gap-3">
                <button
                  id="hero-play-btn"
                  onClick={() => {
                    if (currentTrack?.id === heroTrack.id) {
                      togglePlay();
                    } else {
                      playTrack(heroTrack, trendingTracks);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#fa2d48] hover:bg-[#e0263f] text-white font-bold text-sm shadow-xl shadow-[#fa2d48]/40 hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{currentTrack?.id === heroTrack.id && isPlaying ? 'Jeda Musik' : 'Dengarkan Sekarang'}</span>
                </button>

                <button
                  onClick={() => onOpenPlaylistModal(heroTrack)}
                  className="p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all active:scale-95"
                  title="Tambah ke Playlist"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  onClick={() => toggleFavoriteAction(heroTrack)}
                  className="p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all active:scale-95"
                  title="Favorit"
                >
                  <Heart className={`w-4 h-4 ${isFavorite(heroTrack.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>
            </div>

            <div className="hidden sm:block w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20 shrink-0">
              <img
                src={heroTrack.thumbnail}
                alt={heroTrack.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </section>
      )}

      {/* Trending Music Horizontal Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#fa2d48]" />
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Trending Hari Ini
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('recommendations')}
            className="text-xs font-semibold text-[#fa2d48] hover:underline flex items-center gap-1"
          >
            Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {trendingTracks.slice(0, 12).map((track) => {
            const isThisPlaying = currentTrack?.id === track.id && isPlaying;

            return (
              <div
                key={track.id}
                onClick={() => playTrack(track, trendingTracks)}
                className="apple-card group relative p-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all cursor-pointer border border-transparent hover:border-black/5 dark:hover:border-white/10"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 shadow-md">
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Play Button Overlay */}
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                    isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <div className="w-10 h-10 rounded-full bg-[#fa2d48] text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      {isThisPlaying ? (
                        <div className="flex gap-0.5 items-end h-3">
                          <span className="w-0.5 h-3 bg-white animate-pulse" />
                          <span className="w-0.5 h-2 bg-white animate-pulse delay-75" />
                          <span className="w-0.5 h-3 bg-white animate-pulse delay-150" />
                        </div>
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </div>
                  </div>

                  {track.duration && (
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-medium text-white">
                      {track.duration}
                    </span>
                  )}
                </div>

                <h3 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {track.title}
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                  {track.artist}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Baru Saja Diputar (From IndexedDB) */}
      {history.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Baru Saja Diputar
              </h2>
            </div>
            <span className="text-xs text-neutral-400 font-medium">Tersimpan di IndexedDB</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {history.slice(0, 6).map((track) => (
              <div
                key={`history-${track.id}`}
                onClick={() => playTrack(track, history)}
                className="apple-card group relative p-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all cursor-pointer border border-transparent hover:border-black/5 dark:hover:border-white/10"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 shadow-md">
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-[#fa2d48] text-white flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {track.title}
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  {track.artist}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lagu Favorit Saya (From IndexedDB) */}
      {favorites.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Favorit Anda
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('playlist')}
              className="text-xs font-semibold text-[#fa2d48] hover:underline flex items-center gap-1"
            >
              Lihat di Perpustakaan <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {favorites.slice(0, 6).map((track) => (
              <div
                key={`fav-${track.id}`}
                onClick={() => playTrack(track, favorites)}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all cursor-pointer group"
              >
                <img
                  src={track.thumbnail}
                  alt={track.title}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-[#fa2d48] transition-colors">
                    {track.title}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    {track.artist}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#fa2d48]/10 text-[#fa2d48] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
