import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { Track } from '../../types';
import { searchYouTubeMusic, VIRAL_RECOMMENDED_TRACKS, FALLBACK_TRENDING_TRACKS } from '../../lib/youtube';
import { 
  Search, 
  X, 
  Play, 
  Pause,
  Heart, 
  Plus, 
  Flame, 
  Music,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface SearchViewProps {
  onOpenPlaylistModal: (track: Track) => void;
}

const TRENDING_SEARCHES = [
  'Bernadya',
  'Sal Priadi',
  'Lady Gaga Bruno Mars',
  'Juicy Luicy',
  'Nadhif Basalamah',
  'Lagu Viral TikTok',
  'Billie Eilish',
  'Mahalini',
  'Hindia',
  'Pop Indonesia 2026'
];

export const SearchView: React.FC<SearchViewProps> = ({ onOpenPlaylistModal }) => {
  const { 
    playTrack, 
    currentTrack, 
    isPlaying, 
    togglePlay,
    toggleFavoriteAction, 
    isFavorite 
  } = usePlayer();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await searchYouTubeMusic(query.trim());
        setResults(res);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query]);

  const handlePillClick = (term: string) => {
    setQuery(term);
  };

  const handleTrackClick = (track: Track, list: Track[]) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, list);
    }
  };

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-300 max-w-4xl">
      {/* Header & Search Bar */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 select-none">
          Pencarian
        </h1>
        <p className="text-xs text-neutral-400 mb-4">
          Cari lagu, artis, lirik, atau putar rekomendasi musik viral di bawah ini
        </p>

        {/* Search Input Box */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari artis, lagu, lirik YouTube..."
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#fa2d48] focus:border-transparent transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Search Term Pills */}
      {!query && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TRENDING_SEARCHES.map((term) => (
            <button
              key={term}
              onClick={() => handlePillClick(term)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.05] hover:bg-[#fa2d48]/20 hover:text-[#fa2d48] text-neutral-300 border border-white/5 whitespace-nowrap transition-all shrink-0"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {/* When Empty Query: Sleek Music Recommendations (No big photos/cards) */}
      {!query && (
        <div className="space-y-8 pt-2">
          {/* Section 1: Rekomendasi Lagu Viral */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#fa2d48]" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  Rekomendasi Lagu Viral & Trending
                </h2>
              </div>
              <span className="text-[11px] text-[#fa2d48] font-semibold bg-[#fa2d48]/10 px-2 py-0.5 rounded-full">
                TikTok & Top Hits
              </span>
            </div>

            {/* Compact Music Rows List (Replaces large photo cards) */}
            <div className="divide-y divide-white/[0.04] bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
              {VIRAL_RECOMMENDED_TRACKS.map((track, idx) => {
                const isThisPlaying = currentTrack?.id === track.id && isPlaying;
                const isThisCurrent = currentTrack?.id === track.id;

                return (
                  <div
                    key={track.id}
                    onClick={() => handleTrackClick(track, VIRAL_RECOMMENDED_TRACKS)}
                    className="flex items-center justify-between p-2.5 sm:p-3 hover:bg-white/[0.05] transition-colors cursor-pointer group select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Rank Number */}
                      <span className={`w-5 text-center text-xs font-bold shrink-0 ${
                        idx < 3 ? 'text-[#fa2d48]' : 'text-neutral-500'
                      }`}>
                        {idx + 1}
                      </span>

                      {/* Small Compact Thumbnail */}
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-sm bg-neutral-800">
                        <img 
                          src={track.thumbnail} 
                          alt={track.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                          isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          {isThisPlaying ? (
                            <Pause className="w-3.5 h-3.5 text-white fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-white fill-current ml-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Title & Artist */}
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs sm:text-sm font-semibold truncate ${
                          isThisCurrent ? 'text-[#fa2d48]' : 'text-white'
                        }`}>
                          {track.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] text-neutral-400 truncate">
                            {track.artist}
                          </p>
                          {track.viewCount && (
                            <span className="hidden sm:inline-block text-[10px] text-neutral-500 truncate">
                              • {track.viewCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right action controls */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline-block">
                        {track.duration}
                      </span>

                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="flex items-center gap-1"
                      >
                        <button
                          onClick={() => toggleFavoriteAction(track)}
                          className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-rose-500 transition-colors"
                          title="Favorit"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFavorite(track.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => onOpenPlaylistModal(track)}
                          className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                          title="Tambah ke Playlist"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Rekomendasi Musik Populer */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Rekomendasi Musik Populer Lainnya
              </h2>
            </div>

            <div className="divide-y divide-white/[0.04] bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
              {FALLBACK_TRENDING_TRACKS.slice(0, 6).map((track, idx) => {
                const isThisPlaying = currentTrack?.id === track.id && isPlaying;
                const isThisCurrent = currentTrack?.id === track.id;

                return (
                  <div
                    key={track.id}
                    onClick={() => handleTrackClick(track, FALLBACK_TRENDING_TRACKS)}
                    className="flex items-center justify-between p-2.5 sm:p-3 hover:bg-white/[0.05] transition-colors cursor-pointer group select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-sm bg-neutral-800">
                        <img 
                          src={track.thumbnail} 
                          alt={track.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                          isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          {isThisPlaying ? (
                            <Pause className="w-3.5 h-3.5 text-white fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-white fill-current ml-0.5" />
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`text-xs sm:text-sm font-semibold truncate ${
                          isThisCurrent ? 'text-[#fa2d48]' : 'text-white'
                        }`}>
                          {track.title}
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline-block">
                        {track.duration}
                      </span>
                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="flex items-center gap-1"
                      >
                        <button
                          onClick={() => toggleFavoriteAction(track)}
                          className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-rose-500 transition-colors"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFavorite(track.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => onOpenPlaylistModal(track)}
                          className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {isSearching && (
        <div className="py-12 flex flex-col items-center justify-center">
          <div className="w-7 h-7 border-2 border-[#fa2d48] border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-neutral-300 font-medium animate-pulse">sabar ya !</p>
        </div>
      )}

      {/* Search Results (Compact Music List, No Oversized Photos) */}
      {!isSearching && query && results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
              Hasil Pencarian ({results.length} Lagu)
            </h2>
          </div>

          <div className="divide-y divide-white/[0.04] bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
            {results.map((track, idx) => {
              const isThisPlaying = currentTrack?.id === track.id && isPlaying;
              const isThisCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackClick(track, results)}
                  className={`flex items-center justify-between p-2.5 sm:p-3 hover:bg-white/[0.05] transition-colors cursor-pointer group select-none ${
                    idx === 0 ? 'bg-white/[0.03]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Rank/Index Indicator */}
                    <span className="w-5 text-center text-xs font-mono text-neutral-500 shrink-0">
                      {idx + 1}
                    </span>

                    {/* Compact Thumbnail */}
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 shadow-sm bg-neutral-800">
                      <img 
                        src={track.thumbnail} 
                        alt={track.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        {isThisPlaying ? (
                          <Pause className="w-4 h-4 text-white fill-current" />
                        ) : (
                          <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Song Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs sm:text-sm font-semibold truncate ${
                          isThisCurrent ? 'text-[#fa2d48]' : 'text-white'
                        }`}>
                          {track.title}
                        </p>
                        {idx === 0 && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#fa2d48]/20 text-[#fa2d48] shrink-0">
                            Teratas
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {track.artist}
                        {track.viewCount ? ` • ${track.viewCount}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right side controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline-block">
                      {track.duration}
                    </span>

                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className="flex items-center gap-1"
                    >
                      <button
                        onClick={() => toggleFavoriteAction(track)}
                        className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-rose-500 transition-colors"
                        title="Favorit"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFavorite(track.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                      <button
                        onClick={() => onOpenPlaylistModal(track)}
                        className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                        title="Tambah ke Playlist"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty Search Result state */}
      {!isSearching && query && results.length === 0 && (
        <div className="py-16 text-center">
          <Music className="w-10 h-10 text-neutral-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-neutral-200">
            Tidak menemukan lagu untuk "{query}"
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            Coba cari dengan nama artis atau judul lagu yang berbeda
          </p>
        </div>
      )}
    </div>
  );
};
