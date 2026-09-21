import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { Track } from '../../types';
import { VIRAL_RECOMMENDED_TRACKS, FALLBACK_TRENDING_TRACKS, searchYouTubeMusic } from '../../lib/youtube';
import { 
  Sparkles, 
  Play, 
  Pause, 
  Heart, 
  Plus, 
  Flame, 
  Compass, 
  Music,
  Headphones
} from 'lucide-react';

interface RecommendationsViewProps {
  onOpenPlaylistModal: (track: Track) => void;
}

const MOOD_CATEGORIES = [
  { name: 'Viral TikTok & Reels', query: 'lagu viral tiktok reels 2026', color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30' },
  { name: 'Pop Galau & Senja', query: 'lagu pop galau indonesia bernadya mahalini', color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30' },
  { name: 'Indie Indonesia', query: 'lagu indie indonesia hindia sal priadi', color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30' },
  { name: 'Hits Global 2026', query: 'top billboard global hits 2026', color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30' },
];

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({ onOpenPlaylistModal }) => {
  const { 
    playTrack, 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    toggleFavoriteAction, 
    isFavorite 
  } = usePlayer();

  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  const handleTrackClick = (track: Track, list: Track[]) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, list);
    }
  };

  const handleCategoryClick = async (category: typeof MOOD_CATEGORIES[0]) => {
    setLoadingCategory(category.name);
    try {
      const results = await searchYouTubeMusic(category.query);
      if (results.length > 0) {
        playTrack(results[0], results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCategory(null);
    }
  };

  return (
    <div className="space-y-8 pb-32 max-w-4xl animate-in fade-in duration-300">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-6 h-6 text-[#fa2d48]" />
          <h1 className="text-3xl font-extrabold tracking-tight text-white select-none">
            Rekomendasi
          </h1>
        </div>
        <p className="text-xs text-neutral-400">
          Koleksi musik pilihan, lagu viral terhangat, dan tangga lagu favorit untukmu
        </p>
      </div>

      {/* Mood & Genre Quick Play Bars */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MOOD_CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => handleCategoryClick(cat)}
            disabled={loadingCategory === cat.name}
            className={`p-3.5 rounded-xl border bg-gradient-to-br ${cat.color} text-left transition-all hover:scale-[1.02] active:scale-98 flex flex-col justify-between h-20 group relative overflow-hidden`}
          >
            <span className="text-xs font-bold text-white leading-tight">
              {cat.name}
            </span>
            <div className="flex items-center justify-between text-[11px] text-neutral-300">
              <span className="flex items-center gap-1 font-medium">
                <Headphones className="w-3 h-3 text-[#fa2d48]" />
                {loadingCategory === cat.name ? 'sabar ya !' : 'Putar Radio'}
              </span>
              <Play className="w-3.5 h-3.5 fill-current opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>

      {/* Section 1: Tangga Lagu Viral Terkini */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#fa2d48]" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Lagu Viral Paling Banyak Diputar
            </h2>
          </div>
          <span className="text-[11px] text-[#fa2d48] font-semibold bg-[#fa2d48]/10 px-2 py-0.5 rounded-full">
            Trending Saat Ini
          </span>
        </div>

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
                  <span className={`w-5 text-center text-xs font-bold shrink-0 ${
                    idx < 3 ? 'text-[#fa2d48]' : 'text-neutral-500'
                  }`}>
                    {idx + 1}
                  </span>

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

      {/* Section 2: Pilihan Hits Tambahan */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Hits Sepanjang Masa
          </h2>
        </div>

        <div className="divide-y divide-white/[0.04] bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
          {FALLBACK_TRENDING_TRACKS.map((track, idx) => {
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
  );
};
