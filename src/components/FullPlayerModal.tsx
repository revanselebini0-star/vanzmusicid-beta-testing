import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { 
  ChevronDown, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Heart, 
  Quote, 
  ListMusic, 
  Volume2, 
  VolumeX, 
  Share2, 
  Plus, 
  Tv, 
  Sparkles,
  Radio,
  Search,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatViews } from '../lib/musicService';
import { LyricsSearchModal } from './LyricsSearchModal';
import { AdminLikeBoosterModal } from './AdminLikeBoosterModal';
import { subscribeSongLikes } from '../lib/songLikeService';

interface FullPlayerModalProps {
  onAddToPlaylist: () => void;
}

export const FullPlayerModal: React.FC<FullPlayerModalProps> = ({ onAddToPlaylist }) => {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    playNext, 
    playPrevious, 
    currentTime, 
    duration, 
    seekTo, 
    volume, 
    setVolume, 
    isMuted, 
    toggleMute, 
    isShuffle, 
    toggleShuffle, 
    repeatMode, 
    toggleRepeat, 
    isFullPlayerOpen, 
    setFullPlayerOpen, 
    isLyricsOpen, 
    setLyricsOpen, 
    isVideoMode, 
    setVideoMode, 
    lyrics, 
    lyricsResult,
    isLoadingLyrics, 
    isBuffering,
    isFavorite, 
    toggleFavoriteAction, 
    queue, 
    queueIndex,
    ytContainerId,
    isAdmin
  } = usePlayer();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsSearchModalOpen, setLyricsSearchModalOpen] = useState(false);
  const [isAdminBoosterOpen, setIsAdminBoosterOpen] = useState(false);
  const [trackLikes, setTrackLikes] = useState<number>(0);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const [activeLyricIndex, setActiveLyricIndex] = useState<number>(-1);
  const isUserScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLyricsScroll = () => {
    isUserScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 2500);
  };

  // Subscribe to real-time song likes
  useEffect(() => {
    if (!currentTrack?.id) return;
    const unsub = subscribeSongLikes(currentTrack.id, (count) => {
      setTrackLikes(count);
    });
    return () => unsub();
  }, [currentTrack?.id]);

  // Calculate current active lyric line based on currentTime
  useEffect(() => {
    if (!lyrics || lyrics.length === 0) {
      setActiveLyricIndex(-1);
      return;
    }

    let foundIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        foundIndex = i;
      } else {
        break;
      }
    }
    if (foundIndex !== activeLyricIndex) {
      setActiveLyricIndex(foundIndex);
    }
  }, [currentTime, lyrics, activeLyricIndex]);

  // Auto-scroll lyrics container smoothly to center active line
  useEffect(() => {
    if (!isFullPlayerOpen || !lyricsContainerRef.current || activeLyricIndex < 0 || isUserScrollingRef.current) {
      return;
    }

    const container = lyricsContainerRef.current;
    const activeEl = container.querySelector(`[data-lyric-index="${activeLyricIndex}"]`) as HTMLElement;
    if (activeEl) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      const targetScroll =
        container.scrollTop +
        (activeRect.top - containerRect.top) -
        containerRect.height / 2 +
        activeRect.height / 2;

      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
    }
  }, [activeLyricIndex, isFullPlayerOpen, isLyricsOpen, lyrics]);

  if (!currentTrack || !isFullPlayerOpen) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const remainingTime = duration > currentTime ? `-${formatTime(duration - currentTime)}` : '0:00';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-white overflow-hidden select-none"
      >
        {/* Dynamic Blurred Artwork Canvas Backdrop */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <img 
            src={currentTrack.thumbnail} 
            alt="background"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-150 blur-3xl opacity-50 contrast-125 saturate-150 animate-pulse transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-neutral-950/40" />
        </div>

        {/* Top App Bar Header */}
        <header className="relative z-10 flex items-center justify-between px-6 pt-3 pb-0">
          <button
            id="close-full-player-btn"
            onClick={() => setFullPlayerOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Tutup pemutar"
          >
            <ChevronDown className="w-6 h-6 text-white/80" />
          </button>

          {/* Empty spacer to keep layout balanced */}
          <div className="w-10" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQueueOpen(prev => !prev)}
              className={`p-2 rounded-full transition-colors ${
                isQueueOpen ? 'bg-white/20 text-[var(--theme-accent)]' : 'hover:bg-white/10 text-white/80'
              }`}
              title="Daftar Putar Berikutnya"
            >
              <ListMusic className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content Area: Cover Artwork or Synced Lyrics View */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 md:px-14 pt-0 pb-2 min-h-0 overflow-hidden">
          {!isLyricsOpen ? (
            /* Album Cover Artwork View (Default) */
            <motion.div
              key="artwork-view"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: isPlaying ? 1 : 0.92 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 260, damping: 25 }}
              onClick={() => setLyricsOpen(true)}
              className="relative w-full max-w-[300px] sm:max-w-[340px] md:max-w-[380px] aspect-square rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.75)] border border-white/15 cursor-pointer group"
              title="Ketuk untuk melihat lirik"
            >
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </motion.div>
          ) : (
            /* Synced Lyrics View */
            <div className="w-full max-w-2xl h-full flex flex-col min-h-0">
              <div 
                ref={lyricsContainerRef}
                onScroll={handleLyricsScroll}
                className="relative flex-1 overflow-y-auto pr-3 space-y-6 py-[35vh] mask-gradient-y scroll-smooth no-scrollbar"
              >
                {lyrics.length > 0 ? (
                  lyrics.map((line, idx) => {
                    const isActive = idx === activeLyricIndex;
                    const isPast = idx < activeLyricIndex;
                    const isInstrumental = line.text === '•••';

                    // Calculate vocal progress percentage for the active line
                    let vocalProgress = 0;
                    if (isActive) {
                      const currentLineTime = line.time;
                      const nextLineTime = lyrics[idx + 1] ? lyrics[idx + 1].time : (currentLineTime + 3.8);
                      const lineDuration = Math.max(0.6, nextLineTime - currentLineTime);
                      const timeIntoLine = Math.max(0, currentTime - currentLineTime);
                      vocalProgress = Math.min(100, Math.max(0, (timeIntoLine / lineDuration) * 100));
                    } else if (isPast) {
                      vocalProgress = 100;
                    }

                    // Hide past instrumental dots completely so they don't leave blank gaps above
                    if (isInstrumental && !isActive) {
                      return (
                        <div
                          key={`${line.time}-${idx}`}
                          data-lyric-index={idx}
                          className="h-0 overflow-hidden opacity-0 pointer-events-none"
                        />
                      );
                    }

                    return (
                      <div
                        key={`${line.time}-${idx}`}
                        data-lyric-index={idx}
                        onClick={() => {
                          isUserScrollingRef.current = false;
                          seekTo(line.time);
                        }}
                        className={`group relative cursor-pointer transition-all duration-500 ease-out select-none py-1.5 px-3 rounded-2xl ${
                          isActive 
                            ? 'scale-[1.04] translate-x-2 md:translate-x-3' 
                            : isPast 
                              ? 'scale-100 translate-x-0 pointer-events-none' 
                              : 'scale-[0.98] translate-x-0 hover:text-white/60'
                        }`}
                      >
                        {isInstrumental ? (
                          /* Three aligned dots (titik 3 sejajar) for Intro / Instrumental / Non-vocal parts */
                          <div className="flex items-center gap-3 py-2">
                            {[0, 1, 2].map((dotIdx) => {
                              // Each dot fills up sequentially from 0->33%, 33->66%, 66->100%
                              const dotStart = dotIdx * 33.33;
                              const dotFill = Math.min(1, Math.max(0, (vocalProgress - dotStart) / 33.33));
                              return (
                                <span
                                  key={dotIdx}
                                  style={{
                                    opacity: 0.25 + dotFill * 0.75,
                                    transform: `scale(${0.85 + dotFill * 0.3})`,
                                    boxShadow: dotFill > 0.5 ? '0 0 12px rgba(255,255,255,0.75)' : 'none'
                                  }}
                                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white transition-all duration-200"
                                />
                              );
                            })}
                          </div>
                        ) : (
                          /* Animated Vocal Slide Text (Apple Music karaoke illumination) */
                          <div
                            style={
                              isActive
                                ? {
                                    backgroundImage: `linear-gradient(90deg, #ffffff 0%, #ffffff ${vocalProgress}%, rgba(255, 255, 255, 0.4) ${Math.min(100, vocalProgress + 15)}%, rgba(255, 255, 255, 0.2) 100%)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))'
                                  }
                                : isPast
                                ? {
                                    opacity: 0,
                                    filter: 'blur(6px)',
                                    pointerEvents: 'none'
                                  }
                                : {
                                    color: 'rgba(255, 255, 255, 0.45)',
                                    filter: 'blur(6px)'
                                  }
                            }
                            className={`font-black tracking-tight leading-relaxed transition-all duration-300 ${
                              isActive
                                ? 'text-2xl sm:text-3xl md:text-4xl text-white'
                                : isPast
                                ? 'text-lg sm:text-xl md:text-2xl font-bold opacity-0'
                                : 'text-lg sm:text-xl md:text-2xl font-bold'
                            }`}
                          >
                            {line.text}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-white/60 p-6">
                    <Sparkles className="w-10 h-10 mb-3 text-[var(--theme-accent)]" />
                    <p className="text-base font-bold text-white">Lirik resmi belum ditemukan secara otomatis</p>
                    <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
                      Jangan khawatir! Kamu bisa mencari lirik resmi yang tepat atau menempel teks lirik untuk lagu ini.
                    </p>
                    <button
                      onClick={() => setLyricsSearchModalOpen(true)}
                      className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-[var(--theme-glow)] transition-all cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      <span>Cari Lirik Resmi Sekarang</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Up Next Queue Drawer */}
          {isQueueOpen && (
            <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-neutral-900/90 backdrop-blur-2xl border-l border-white/10 p-5 z-20 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-[var(--theme-accent)]" />
                  Berikutnya dalam Antrean
                </h3>
                <button 
                  onClick={() => setIsQueueOpen(false)}
                  className="text-xs text-white/60 hover:text-white"
                >
                  Tutup
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
                {queue.map((track, i) => (
                  <div
                    key={`${track.id}-${i}`}
                    onClick={() => usePlayer().playTrack(track)}
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                      i === queueIndex 
                        ? 'bg-[var(--theme-accent)]/20 border border-[var(--theme-accent)]/40' 
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <img 
                      src={track.thumbnail} 
                      alt={track.title} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate ${i === queueIndex ? 'text-[var(--theme-accent)]' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <p className="text-[10px] text-white/60 truncate">{track.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Playback Controls */}
        <div className="relative z-10 px-6 md:px-14 pb-[max(env(safe-area-inset-bottom),1.75rem)] pt-1 max-w-2xl mx-auto w-full">
          {/* Song Meta (Title & Artist) + Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0 flex-1 mr-4">
              <h2 className="text-lg md:text-xl font-bold text-white truncate">
                {currentTrack.title}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-sm md:text-base text-white/70 truncate">
                  {currentTrack.artist}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Special Admin Booster Button */}
              {isAdmin && (
                <button
                  id="full-player-admin-boost-btn"
                  onClick={() => setIsAdminBoosterOpen(true)}
                  className="px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 to-amber-600/30 hover:from-amber-500/50 hover:to-amber-600/50 border border-amber-400/40 active:scale-95 transition-all text-amber-300 flex items-center gap-1.5 text-xs font-bold shadow-md shadow-amber-500/20"
                  title="Pusat Kendali Admin: Tambah / Boost Like Lagu"
                >
                  <Zap className="w-3.5 h-3.5 fill-current text-amber-400" />
                  <span className="text-[11px]">Boost Like</span>
                </button>
              )}

              {/* Add to Playlist */}
              <button
                id="full-player-add-playlist-btn"
                onClick={onAddToPlaylist}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white/90"
                title="Tambahkan ke Playlist"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Heart Favorite with Like Count */}
              <button
                id="full-player-favorite-btn"
                onClick={() => toggleFavoriteAction(currentTrack)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full active:scale-95 transition-all text-xs font-bold ${
                  isFavorite(currentTrack.id) 
                    ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400' 
                    : 'bg-white/10 hover:bg-white/20 text-white/90'
                }`}
                title="Sukai Lagu Ini"
              >
                <Heart 
                  className={`w-4 h-4 ${
                    isFavorite(currentTrack.id) ? 'fill-rose-500 text-rose-500' : 'text-white/90'
                  }`} 
                />
                {trackLikes > 0 && (
                  <span className="text-[11px] font-semibold">{trackLikes.toLocaleString('id-ID')}</span>
                )}
              </button>
            </div>
          </div>


          {/* Interactive Scrub Bar */}
          <div className="space-y-1">
            <div 
              className="relative h-2 bg-white/20 rounded-full cursor-pointer overflow-hidden group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickPos = (e.clientX - rect.left) / rect.width;
                seekTo(clickPos * duration);
              }}
            >
              <div 
                className="h-full bg-white group-hover:bg-[var(--theme-accent)] rounded-full transition-all duration-150"
                style={{ width: `${progressPercent}%`, backgroundColor: 'var(--theme-accent)' }}
              />
            </div>

            <div className="flex justify-between text-[11px] font-medium text-white/60">
              <span>{formatTime(currentTime)}</span>
              <span>{remainingTime}</span>
            </div>
          </div>

          {/* Core Controls Row (Shuffle, Prev, Play/Pause, Next, Repeat) */}
          <div className="flex items-center justify-between mt-4">
            <button
              id="shuffle-toggle-btn"
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition-all ${
                isShuffle ? 'text-[var(--theme-accent)] bg-white/10' : 'text-white/60 hover:text-white'
              }`}
              title="Acak Lagu"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              id="prev-track-btn"
              onClick={playPrevious}
              className="p-3 text-white/90 hover:text-white active:scale-90 transition-transform"
              title="Lagu Sebelumnya"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>

            {/* Prominent Play/Pause Button */}
            <div className="flex flex-col items-center">
              <button
                id="full-player-toggle-btn"
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-95 transition-transform relative"
                title={isBuffering ? "sabar ya !" : isPlaying ? "Jeda" : "Putar"}
              >
                {isBuffering ? (
                  <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-1" />
                )}
              </button>
              {isBuffering && (
                <span className="text-[11px] font-semibold text-[var(--theme-accent)] animate-pulse mt-1.5">
                  sabar ya !
                </span>
              )}
            </div>

            <button
              id="next-track-btn"
              onClick={playNext}
              className="p-3 text-white/90 hover:text-white active:scale-90 transition-transform"
              title="Lagu Berikutnya"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>

            <button
              id="repeat-toggle-btn"
              onClick={toggleRepeat}
              className={`p-2 rounded-full transition-all relative ${
                repeatMode !== 'off' ? 'text-[var(--theme-accent)] bg-white/10' : 'text-white/60 hover:text-white'
              }`}
              title="Ulangi Lagu"
            >
              {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          {/* Bottom Row: Volume Slider + Lyrics Toggle */}
          <div className="flex items-center justify-between gap-4 mt-6">
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <button onClick={toggleMute} className="text-white/60 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--theme-accent)]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                id="toggle-lyrics-view-btn"
                onClick={() => setLyricsOpen(!isLyricsOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isLyricsOpen 
                    ? 'bg-white text-black shadow-lg shadow-white/20' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Quote className="w-3.5 h-3.5" />
                <span>Lirik</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Cari / Koreksi Lirik Asli */}
        <LyricsSearchModal 
          isOpen={isLyricsSearchModalOpen}
          onClose={() => setLyricsSearchModalOpen(false)}
        />

        {/* Modal Admin Booster Like (Hanya untuk Admin) */}
        {isAdmin && (
          <AdminLikeBoosterModal
            isOpen={isAdminBoosterOpen}
            onClose={() => setIsAdminBoosterOpen(false)}
            initialTrack={currentTrack}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
