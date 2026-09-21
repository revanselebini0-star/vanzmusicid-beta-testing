import React, { useState, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { 
  Shuffle, 
  SkipBack, 
  Play, 
  Pause, 
  SkipForward, 
  Repeat, 
  MoreHorizontal, 
  ListMusic, 
  Volume2, 
  VolumeX,
  Quote
} from 'lucide-react';

export const MiniPlayer: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    isBuffering,
    togglePlay, 
    playNext, 
    playPrevious,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    setFullPlayerOpen, 
    setLyricsOpen,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    currentTime,
    duration,
    seekTo,
    isBottomBarsVisible
  } = usePlayer();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const displayTrack = currentTrack || {
    id: 'Nskf70DMR60',
    title: 'Sesi Potret',
    artist: 'enau, Ari Lesmana — Sesi Potret - Single',
    thumbnail: 'https://i.ytimg.com/vi/Nskf70DMR60/hqdefault.jpg',
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const activeCurrentTime = isSeeking ? seekTime : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (activeCurrentTime / duration) * 100)) : 0;

  const handleSeekStart = (clientX: number) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const target = pos * duration;
    setIsSeeking(true);
    setSeekTime(target);
  };

  const handleSeekMove = (clientX: number) => {
    if (!isSeeking || !progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    setSeekTime(pos * duration);
  };

  const handleSeekEnd = () => {
    if (isSeeking) {
      seekTo(seekTime);
      setIsSeeking(false);
    }
  };

  return (
    <div 
      className={`fixed bottom-[calc(max(env(safe-area-inset-bottom),12px)+68px)] lg:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95vw] sm:w-auto max-w-md lg:max-w-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
        isBottomBarsVisible
          ? 'translate-y-0 pointer-events-auto'
          : 'translate-y-[64px] lg:translate-y-0 pointer-events-auto shadow-2xl'
      }`}
    >
      <div 
        id="dock-player-bar"
        className="relative bg-black/60 backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.14] rounded-2xl sm:rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex items-center justify-between sm:justify-start gap-2 sm:gap-3.5 text-neutral-300 select-none transition-all ring-1 ring-white/5 overflow-hidden group/dock before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.06] before:to-transparent before:pointer-events-none"
      >
        {/* Subtle, slim top progress bar indicating song duration */}
        <div 
          ref={progressBarRef}
          onMouseDown={(e) => {
            handleSeekStart(e.clientX);
            const onMouseMove = (ev: MouseEvent) => handleSeekMove(ev.clientX);
            const onMouseUp = () => {
              window.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('mouseup', onMouseUp);
              handleSeekEnd();
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
          }}
          onTouchStart={(e) => {
            if (e.touches[0]) handleSeekStart(e.touches[0].clientX);
          }}
          onTouchMove={(e) => {
            if (e.touches[0]) handleSeekMove(e.touches[0].clientX);
          }}
          onTouchEnd={handleSeekEnd}
          className="absolute top-0 left-0 right-0 h-1 sm:h-1 hover:h-2 transition-all cursor-pointer bg-white/10 group/bar z-10"
          title={`Durasi: ${formatTime(activeCurrentTime)} / ${formatTime(duration)} (Klik atau geser untuk memindahkan)`}
        >
          {/* Progress fill */}
          <div 
            className="h-full bg-[var(--theme-accent)] transition-all duration-75 relative"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Small subtle thumb on hover/drag */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-sm opacity-0 group-hover/dock:opacity-100 transition-opacity pointer-events-none" />
          </div>
        </div>

        {/* Shuffle */}
        <button
          onClick={toggleShuffle}
          className={`hidden md:flex p-1.5 rounded-full hover:text-white transition-colors ${
            isShuffle ? 'text-[var(--theme-accent)]' : 'text-neutral-400'
          }`}
          title="Acak"
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>

        {/* Previous */}
        <button
          onClick={playPrevious}
          className="p-1 rounded-full hover:text-white transition-colors text-neutral-300 shrink-0"
          title="Sebelumnya"
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>

        {/* Play/Pause / Buffering */}
        <button
          onClick={togglePlay}
          className="p-1.5 rounded-full hover:text-white transition-colors text-white shrink-0 relative"
          title={isBuffering ? "sabar ya !" : isPlaying ? "Jeda" : "Putar"}
        >
          {isBuffering ? (
            <div className="w-4 h-4 border-2 border-[var(--theme-accent)] border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={playNext}
          className="p-1 rounded-full hover:text-white transition-colors text-neutral-300 shrink-0"
          title="Berikutnya"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>

        {/* Repeat */}
        <button
          onClick={toggleRepeat}
          className={`hidden md:flex p-1.5 rounded-full hover:text-white transition-colors ${
            repeatMode !== 'off' ? 'text-[var(--theme-accent)]' : 'text-neutral-400'
          }`}
          title="Ulangi"
        >
          <Repeat className="w-3.5 h-3.5" />
        </button>

        <div className="hidden sm:block h-5 w-[1px] bg-white/10 mx-0.5" />

        {/* Track Info & Duration Pill */}
        <div 
          onClick={() => setFullPlayerOpen(true)}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity min-w-0 flex-1 sm:flex-initial max-w-[170px] sm:max-w-xs md:max-w-sm"
        >
          <img 
            src={displayTrack.thumbnail} 
            alt={displayTrack.title}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-md object-cover shadow-sm ring-1 ring-white/10 shrink-0"
          />
          <div className="min-w-0 flex flex-col justify-center">
            <span className="text-xs font-semibold text-white truncate leading-tight">
              {displayTrack.title}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 truncate leading-tight">
              <span className="truncate">{displayTrack.artist}</span>
              {duration > 0 && (
                <>
                  <span className="text-neutral-600">•</span>
                  <span className="font-mono tabular-nums text-neutral-300 shrink-0">
                    {formatTime(activeCurrentTime)}/{formatTime(duration)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-white/10 mx-0.5" />

        {/* Action Buttons (Lyrics, More, Queue) */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => {
              setLyricsOpen(true);
              setFullPlayerOpen(true);
            }}
            className="p-1.5 rounded-full hover:text-white transition-colors text-neutral-400"
            title="Lirik Lagu"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setFullPlayerOpen(true)}
            className="p-1 rounded-full hover:text-white transition-colors text-neutral-400"
            title="Opsi Lainnya"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={() => setFullPlayerOpen(true)}
            className="p-1 rounded-full hover:text-white transition-colors text-neutral-400"
            title="Daftar Putar Berikutnya"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Controls (Desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 text-neutral-400 pl-1">
          <div className="h-5 w-[1px] bg-white/10 mx-0.5" />
          <button onClick={toggleMute} className="hover:text-white transition-colors">
            {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-14 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>
    </div>
  );
};
