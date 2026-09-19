import React from 'react';
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
    toggleMute
  } = usePlayer();

  // If no track is playing yet, provide default representation so the player bar matches the screenshot
  const displayTrack = currentTrack || {
    id: 'Nskf70DMR60',
    title: 'Sesi Potret',
    artist: 'enau, Ari Lesmana — Sesi Potret - Single',
    thumbnail: 'https://i.ytimg.com/vi/Nskf70DMR60/hqdefault.jpg',
  };

  return (
    <div className="fixed bottom-[calc(max(env(safe-area-inset-bottom),12px)+68px)] lg:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95vw] sm:w-auto max-w-md lg:max-w-none pointer-events-auto">
      <div 
        id="dock-player-bar"
        className="bg-[#242426]/95 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-2xl flex items-center justify-between sm:justify-start gap-2 sm:gap-4 text-neutral-300 select-none transition-all ring-1 ring-black/40"
      >
        {/* Shuffle Button (Hidden on small mobile) */}
        <button
          onClick={toggleShuffle}
          className={`hidden md:flex p-1.5 rounded-full hover:text-white transition-colors ${
            isShuffle ? 'text-[var(--theme-accent)]' : 'text-neutral-400'
          }`}
          title="Acak"
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>

        {/* Previous Track */}
        <button
          onClick={playPrevious}
          className="p-1 rounded-full hover:text-white transition-colors text-neutral-300 shrink-0"
          title="Sebelumnya"
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="p-1.5 rounded-full hover:text-white transition-colors text-white shrink-0"
          title={isPlaying ? "Jeda" : "Putar"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Next Track */}
        <button
          onClick={playNext}
          className="p-1 rounded-full hover:text-white transition-colors text-neutral-300 shrink-0"
          title="Berikutnya"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>

        {/* Repeat Button (Hidden on small mobile) */}
        <button
          onClick={toggleRepeat}
          className={`hidden md:flex p-1.5 rounded-full hover:text-white transition-colors ${
            repeatMode !== 'off' ? 'text-[var(--theme-accent)]' : 'text-neutral-400'
          }`}
          title="Ulangi"
        >
          <Repeat className="w-3.5 h-3.5" />
        </button>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-[1px] bg-white/10 mx-1" />

        {/* Center: Track Artwork + Title/Artist + PRATINJAU pill */}
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
            <span className="text-[10px] text-neutral-400 truncate leading-tight">
              {displayTrack.artist}
            </span>
          </div>

          {/* PRATINJAU pill badge from screenshot */}
          <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/10 text-neutral-300 ml-1 shrink-0">
            PRATINJAU
          </span>
        </div>

        {/* Divider */}
        <div className="h-5 w-[1px] bg-white/10 mx-1" />

        {/* More Options / Lyrics */}
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

        {/* Queue / Playlist Icon */}
        <button
          onClick={() => setFullPlayerOpen(true)}
          className="p-1 rounded-full hover:text-white transition-colors text-neutral-400"
          title="Daftar Putar Berikutnya"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Volume Icon & Slider */}
        <div className="hidden md:flex items-center gap-1.5 text-neutral-400 pl-1">
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
