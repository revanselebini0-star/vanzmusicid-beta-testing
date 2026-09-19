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
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatViews } from '../lib/youtube';
import { LyricsSearchModal } from './LyricsSearchModal';

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
    isFavorite, 
    toggleFavoriteAction, 
    queue, 
    queueIndex,
    ytContainerId
  } = usePlayer();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsSearchModalOpen, setLyricsSearchModalOpen] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const [activeLyricIndex, setActiveLyricIndex] = useState<number>(-1);

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
    setActiveLyricIndex(foundIndex);

    // Auto-scroll lyrics container smoothly
    if (isLyricsOpen && lyricsContainerRef.current && foundIndex >= 0) {
      const activeEl = lyricsContainerRef.current.children[foundIndex] as HTMLElement;
      if (activeEl) {
        const container = lyricsContainerRef.current;
        const targetScroll = activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;
        container.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }
    }
  }, [currentTime, lyrics, isLyricsOpen]);

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
        <header className="relative z-10 flex items-center justify-between px-6 pt-4 pb-2">
          <button
            id="close-full-player-btn"
            onClick={() => setFullPlayerOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Tutup pemutar"
          >
            <ChevronDown className="w-6 h-6 text-white/80" />
          </button>

          {/* Center Title / Mode Switcher */}
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs">
            <button
              onClick={() => setVideoMode(false)}
              className={`px-2.5 py-1 rounded-full transition-all font-medium ${
                !isVideoMode ? 'bg-white text-black shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              Audio
            </button>
            <button
              onClick={() => setVideoMode(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all font-medium ${
                isVideoMode ? 'bg-[#fa2d48] text-white shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Video MV</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQueueOpen(prev => !prev)}
              className={`p-2 rounded-full transition-colors ${
                isQueueOpen ? 'bg-white/20 text-[#fa2d48]' : 'hover:bg-white/10 text-white/80'
              }`}
              title="Daftar Putar Berikutnya"
            >
              <ListMusic className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content Area: Artwork, Lyrics, or Video */}
        <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center px-6 md:px-14 py-4 gap-8 min-h-0 overflow-hidden">
          {/* Visual Canvas (Artwork or YouTube Video Frame) */}
          <div className={`w-full max-w-sm md:max-w-md aspect-square flex items-center justify-center transition-all duration-300 ${
            isLyricsOpen ? 'hidden md:flex md:w-1/2 md:max-w-xs' : 'flex'
          }`}>
            {isVideoMode ? (
              <div className="w-full aspect-video rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
                <Tv className="w-10 h-10 text-[#fa2d48] mb-2 animate-pulse" />
                <p className="text-sm font-bold text-white">Pemutaran Video Musik Aktif</p>
                <p className="text-xs text-white/60 mt-1">Video YouTube diputar secara langsung di layar</p>
              </div>
            ) : (
              <div className="relative w-full h-full rounded-3xl overflow-hidden artwork-shadow ring-1 ring-white/10 group">
                <img 
                  src={currentTrack.thumbnail} 
                  alt={currentTrack.title}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-transform duration-700 ${
                    isPlaying ? 'scale-100' : 'scale-95 brightness-90'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-xs text-white/80 font-medium">{currentTrack.viewCount}</span>
                </div>
              </div>
            )}
          </div>

          {/* Synced Lyrics View */}
          {isLyricsOpen && (
            <div className="w-full md:w-1/2 h-full flex flex-col min-h-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Quote className="w-4 h-4 text-[#fa2d48]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                    Lirik Asli
                  </span>

                  {lyricsResult && lyricsResult.lyrics.length > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      {lyricsResult.isSynced ? 'Resmi Sinkron' : 'Teks Resmi'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isLoadingLyrics ? (
                    <span className="text-[11px] text-[#fa2d48] animate-pulse">Memuat lirik asli...</span>
                  ) : (
                    <button
                      id="search-lyrics-btn"
                      onClick={() => setLyricsSearchModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 hover:bg-[#fa2d48] hover:text-white text-white/80 border border-white/10 transition-all cursor-pointer"
                      title="Cari atau ganti lirik jika belum akurat"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{lyrics.length > 0 ? 'Lirik Kurang Akurat? Cari' : 'Cari Lirik'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div 
                ref={lyricsContainerRef}
                className="flex-1 overflow-y-auto pr-3 space-y-5 py-6 mask-gradient-y scroll-smooth"
              >
                {lyrics.length > 0 ? (
                  lyrics.map((line, idx) => {
                    const isActive = idx === activeLyricIndex;
                    const isPast = idx < activeLyricIndex;
                    return (
                      <div
                        key={`${line.time}-${idx}`}
                        onClick={() => seekTo(line.time)}
                        className={`cursor-pointer transition-all duration-300 transform origin-left select-none ${
                          isActive 
                            ? 'text-white text-2xl md:text-3xl font-extrabold scale-105 filter drop-shadow-[0_4px_12px_rgba(250,45,72,0.4)]' 
                            : isPast 
                              ? 'text-white/40 text-lg md:text-xl font-semibold hover:text-white/70' 
                              : 'text-white/20 text-lg md:text-xl font-semibold hover:text-white/60'
                        }`}
                      >
                        {line.text}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-white/60 p-6">
                    <Sparkles className="w-10 h-10 mb-3 text-[#fa2d48]" />
                    <p className="text-base font-bold text-white">Lirik resmi belum ditemukan secara otomatis</p>
                    <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
                      Jangan khawatir! Kamu bisa mencari lirik resmi yang tepat atau menempel teks lirik untuk lagu ini.
                    </p>
                    <button
                      onClick={() => setLyricsSearchModalOpen(true)}
                      className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#fa2d48] hover:bg-[#e0263f] text-white text-xs font-bold shadow-lg shadow-[#fa2d48]/30 transition-all cursor-pointer"
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
                  <ListMusic className="w-4 h-4 text-[#fa2d48]" />
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
                        ? 'bg-[#fa2d48]/20 border border-[#fa2d48]/40' 
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
                      <p className={`text-xs font-semibold truncate ${i === queueIndex ? 'text-[#fa2d48]' : 'text-white'}`}>
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
        <div className="relative z-10 px-6 md:px-14 pb-8 max-w-2xl mx-auto w-full">
          {/* Song Meta (Title & Artist) + Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0 flex-1 mr-4">
              <h2 className="text-lg md:text-xl font-bold text-white truncate">
                {currentTrack.title}
              </h2>
              <p className="text-sm md:text-base text-white/70 truncate">
                {currentTrack.artist}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Add to Playlist */}
              <button
                id="full-player-add-playlist-btn"
                onClick={onAddToPlaylist}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white/90"
                title="Tambahkan ke Playlist"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Heart Favorite */}
              <button
                id="full-player-favorite-btn"
                onClick={() => toggleFavoriteAction(currentTrack)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white/90"
                title="Favorit"
              >
                <Heart 
                  className={`w-5 h-5 ${
                    isFavorite(currentTrack.id) ? 'fill-rose-500 text-rose-500' : 'text-white/90'
                  }`} 
                />
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
                className="h-full bg-white group-hover:bg-[#fa2d48] rounded-full transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
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
                isShuffle ? 'text-[#fa2d48] bg-white/10' : 'text-white/60 hover:text-white'
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
            <button
              id="full-player-toggle-btn"
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-95 transition-transform"
              title={isPlaying ? "Jeda" : "Putar"}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-current" />
              ) : (
                <Play className="w-8 h-8 fill-current ml-1" />
              )}
            </button>

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
                repeatMode !== 'off' ? 'text-[#fa2d48] bg-white/10' : 'text-white/60 hover:text-white'
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
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#fa2d48]"
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
      </motion.div>
    </AnimatePresence>
  );
};
