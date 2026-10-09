import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { Track } from '../../types';
import { searchSongs } from '../../lib/musicService';
import { getVanzTeamTracks } from '../../lib/vanzTeamMusic';
import { 
  Search, 
  X, 
  Play, 
  Pause, 
  Heart, 
  Plus, 
  Music,
  Sparkles,
  Flame,
  Radio,
  Disc,
  Mic,
  Headphones,
  Compass,
  ArrowLeft,
  SlidersHorizontal
} from 'lucide-react';

interface SearchViewProps {
  onOpenPlaylistModal: (track: Track) => void;
}

interface BrowseCategory {
  id: string;
  name: string;
  searchQuery: string;
  description: string;
  gradient: string;
  accentColor: string;
  icon: any;
}

const BROWSE_CATEGORIES: BrowseCategory[] = [
  {
    id: 'pop',
    name: 'Pop',
    searchQuery: 'pop hits indonesia',
    description: 'Pop Indonesia & Barat terpopuler',
    gradient: 'from-pink-600 via-rose-600 to-red-600',
    accentColor: '#f43f5e',
    icon: Flame,
  },
  {
    id: 'k-pop',
    name: 'K-Pop',
    searchQuery: 'kpop',
    description: 'Hits idol grup Korea & chart teratas',
    gradient: 'from-purple-600 via-fuchsia-600 to-pink-500',
    accentColor: '#d946ef',
    icon: Sparkles,
  },
  {
    id: 'instrument',
    name: 'Instrumental',
    searchQuery: 'instrumental',
    description: 'Piano, gitar akustik & nada santai',
    gradient: 'from-amber-600 via-orange-600 to-yellow-600',
    accentColor: '#f59e0b',
    icon: Music,
  },
  {
    id: 'indie',
    name: 'Indie & Senja',
    searchQuery: 'lagu indie indonesia senja bernadya hindia',
    description: 'Koleksi puitis, folk & indie lokal',
    gradient: 'from-orange-700 via-amber-700 to-stone-800',
    accentColor: '#ea580c',
    icon: Headphones,
  },
  {
    id: 'hiphop',
    name: 'Hip-Hop & R&B',
    searchQuery: 'hip hop rnb hits chill groovy',
    description: 'Beat bertenaga & melodi halus',
    gradient: 'from-blue-600 via-indigo-600 to-purple-800',
    accentColor: '#6366f1',
    icon: Mic,
  },
  {
    id: 'rock',
    name: 'Rock & Metal',
    searchQuery: 'rock hits metal indonesia barat',
    description: 'Distorsi gitar & energi tinggi',
    gradient: 'from-red-800 via-neutral-900 to-stone-900',
    accentColor: '#ef4444',
    icon: Disc,
  },
  {
    id: 'dangdut',
    name: 'Dangdut & Koplo',
    searchQuery: 'lagu dangdut koplo terbaru viral heboh',
    description: 'Irama goyang & koplo trending',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    accentColor: '#10b981',
    icon: Radio,
  },
  {
    id: 'lofi',
    name: 'Lo-Fi & Jazz',
    searchQuery: 'lofi chillhop jazz relaxing focus',
    description: 'Musik pengantar fokus & relaksasi',
    gradient: 'from-teal-700 via-cyan-800 to-blue-900',
    accentColor: '#06b6d4',
    icon: Headphones,
  },
  {
    id: 'anime',
    name: 'Anime & J-Pop',
    searchQuery: 'anime ost jpop popular hits',
    description: 'Soundtrack anime & hits Jepang',
    gradient: 'from-violet-600 via-purple-700 to-indigo-900',
    accentColor: '#8b5cf6',
    icon: Sparkles,
  },
  {
    id: 'viral',
    name: 'Viral TikTok',
    searchQuery: 'lagu viral tiktok fyp indonesia 2026',
    description: 'Soundtrack FYP paling banyak dicari',
    gradient: 'from-cyan-600 via-sky-600 to-blue-700',
    accentColor: '#0ea5e9',
    icon: Flame,
  },
  {
    id: 'vanz',
    name: 'Vanz Team Music',
    searchQuery: 'vanz team music',
    description: 'Karya orisinal & rilisan resmi Vanz Team',
    gradient: 'from-red-600 via-rose-600 to-orange-600',
    accentColor: '#fa2d48',
    icon: Disc,
  },
  {
    id: 'religi',
    name: 'Religi & Spiritual',
    searchQuery: 'lagu religi islami shalawat menyejukkan hati',
    description: 'Nada damai & penyejuk jiwa',
    gradient: 'from-emerald-700 via-green-800 to-teal-900',
    accentColor: '#059669',
    icon: Compass,
  }
];

const QUICK_TRENDING_TERMS = [
  'Bernadya',
  'Sal Priadi',
  'Vanz Team Music',
  'K-Pop Hits',
  'Piano Instrumental',
  'Nadhif Basalamah',
  'Viral TikTok',
  'Bruno Mars'
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
  const [activeCategoryName, setActiveCategoryName] = useState<string | null>(null);
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Debounced search via YouTube proxy
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const q = query.trim().toLowerCase();
        
        // Vanz team local catalog matches
        const vanzMatches = getVanzTeamTracks().filter(t => 
          t.title.toLowerCase().includes(q) || 
          t.artist.toLowerCase().includes(q) ||
          (t.albumName && t.albumName.toLowerCase().includes(q))
        );

        // Fetch songs directly from user backend server
        const serverTracks = await searchSongs(query.trim());
        let finalTracks = [...vanzMatches];
        if (serverTracks.length > 0) {
          finalTracks = [...finalTracks, ...serverTracks.filter(ar => !vanzMatches.some(vt => vt.id === ar.id))];
        }
        setResults(finalTracks);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // Handle clicking a genre/category card
  const handleCategoryClick = (category: BrowseCategory) => {
    setActiveCategoryName(category.name);
    setQuery(category.searchQuery || category.name);
  };

  const handlePillClick = (term: string) => {
    setActiveCategoryName(null);
    setQuery(term);
  };

  const handleClearSearch = () => {
    setQuery('');
    setActiveCategoryName(null);
    setResults([]);
    searchInputRef.current?.focus();
  };

  const handleTrackClick = (track: Track, list: Track[]) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, list);
    }
  };

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-300 w-full max-w-6xl mx-auto">
      {/* Header & Search Bar */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 select-none">
          Pencarian
        </h1>
        <p className="text-xs text-neutral-400 mb-4">
          Temukan genre, lagu, artis, lirik, atau video musik favorit Anda
        </p>

        {/* Search Input Box */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (activeCategoryName && e.target.value !== activeCategoryName) {
                setActiveCategoryName(null);
              }
            }}
            placeholder="Cari artis, genre, lagu, lirik..."
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#fa2d48] focus:border-transparent transition-all shadow-inner"
          />
          {query && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
              title="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Trending Searches Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {QUICK_TRENDING_TERMS.map((term) => (
          <button
            key={term}
            onClick={() => handlePillClick(term)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all shrink-0 ${
              query.toLowerCase() === term.toLowerCase()
                ? 'bg-[#fa2d48] text-white border-[#fa2d48]'
                : 'bg-white/[0.05] hover:bg-[#fa2d48]/20 hover:text-[#fa2d48] text-neutral-300 border-white/5'
            }`}
          >
            {term}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 1. BEFORE SEARCH: APPLE MUSIC / SPOTIFY STYLE GENRE & CATEGORY TILES      */}
      {/* ========================================================================= */}
      {!query.trim() && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[var(--theme-accent)]" />
              <span>Jelajahi Kategori & Genre</span>
            </h2>
            <span className="text-xs text-neutral-400 font-medium">
              {BROWSE_CATEGORIES.length} Kategori
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {BROWSE_CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-lg group cursor-pointer border border-white/10 bg-gradient-to-br ${cat.gradient} h-32 sm:h-36 flex flex-col justify-between`}
                >
                  {/* Subtle glass reflection overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />

                  {/* Category Title & Description */}
                  <div className="relative z-10 pr-6">
                    <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug drop-shadow-sm">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-white/85 font-medium line-clamp-2 mt-1 leading-tight">
                      {cat.description}
                    </p>
                  </div>

                  {/* Decorative Icon Watermark at bottom right */}
                  <div className="absolute -bottom-2 -right-2 text-white/25 group-hover:text-white/40 group-hover:rotate-6 group-hover:scale-110 transition-all duration-300 pointer-events-none">
                    <IconComponent className="w-20 h-20 -rotate-12 translate-x-2 translate-y-2 stroke-[1.5]" />
                  </div>

                  {/* Play pill hint on hover */}
                  <div className="relative z-10 flex items-center gap-1 text-[11px] font-semibold text-white/90 group-hover:text-white transition-colors">
                    <span>Eksplor</span>
                    <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. LOADING STATE                                                          */}
      {/* ========================================================================= */}
      {isSearching && (
        <div className="py-16 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#fa2d48] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-neutral-300 font-medium animate-pulse">
            Mencari lagu untuk "{query}"...
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. AFTER SEARCH: REAL SEARCH RESULTS LIST                                 */}
      {/* ========================================================================= */}
      {!isSearching && query.trim() && results.length > 0 && (
        <section className="space-y-3 pt-2">
          {/* Header with Back to Categories button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearSearch}
                className="p-1.5 rounded-xl bg-white/[0.08] hover:bg-white/15 text-neutral-200 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold px-3"
                title="Kembali ke semua kategori"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kategori</span>
              </button>
              <h2 className="text-lg font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md">
                {activeCategoryName ? `Genre: ${activeCategoryName}` : `Hasil "${query}"`}
              </h2>
            </div>
            <span className="text-xs font-semibold text-neutral-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
              {results.length} Lagu
            </span>
          </div>

          {/* Song rows */}
          <div className="divide-y divide-white/[0.04] bg-[#262628]/60 border border-white/5 rounded-2xl overflow-hidden shadow-sm">
            {results.map((track, idx) => {
              const isThisPlaying = currentTrack?.id === track.id && isPlaying;
              const isThisCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackClick(track, results)}
                  className={`flex items-center justify-between p-2.5 sm:p-3 hover:bg-white/[0.06] transition-colors cursor-pointer group select-none ${
                    idx === 0 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Rank Number */}
                    <span className="w-6 text-center text-xs font-mono text-neutral-500 shrink-0">
                      {idx + 1}
                    </span>

                    {/* Thumbnail */}
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

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs sm:text-sm font-semibold truncate ${
                        isThisCurrent ? 'text-[#fa2d48]' : 'text-white'
                      }`}>
                        {track.title}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {track.artist}
                        {track.viewCount ? ` • ${track.viewCount}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-3">
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
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. EMPTY SEARCH RESULTS                                                   */}
      {/* ========================================================================= */}
      {!isSearching && query.trim() && results.length === 0 && (
        <div className="py-16 text-center space-y-3">
          <Music className="w-10 h-10 text-neutral-500 mx-auto" />
          <p className="text-sm font-bold text-neutral-200">
            Tidak menemukan lagu untuk "{query}"
          </p>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Coba gunakan kata kunci artis atau pilih salah satu genre kategori di bawah ini.
          </p>
          <button
            onClick={handleClearSearch}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Semua Genre</span>
          </button>
        </div>
      )}
    </div>
  );
};
