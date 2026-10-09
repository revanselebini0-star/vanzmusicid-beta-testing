import React, { useEffect, useState, useRef, useMemo } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { Track } from '../../types';
import { 
  getTrendingMusic, 
  searchSongs,
  FALLBACK_TRENDING_TRACKS
} from '../../lib/musicService';
import { getVanzTeamTracks } from '../../lib/vanzTeamMusic';
import { 
  Play, 
  Sparkles, 
  Flame, 
  Clock, 
  Heart, 
  Plus, 
  ChevronLeft,
  ChevronRight, 
  Radio, 
  Music2,
  TrendingUp,
  Globe2,
  Compass
} from 'lucide-react';

interface ListenNowViewProps {
  onOpenPlaylistModal: (track: Track) => void;
}

const ShelfRow: React.FC<{
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  badge?: string;
  tracks: Track[];
  onOpenPlaylistModal: (track: Track) => void;
  onSeeAll?: () => void;
}> = ({ title, icon, subtitle, badge, tracks, onOpenPlaylistModal, onSeeAll }) => {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!tracks || tracks.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {icon}
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white select-none">
              {title}
            </h2>
            {badge && (
              <span className="text-[10px] font-bold text-neutral-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full select-none">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-neutral-400 mt-0.5 select-none">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-3">
          {onSeeAll && (
            <button
              onClick={onSeeAll}
              className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors mr-1 flex items-center gap-0.5"
            >
              Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-all active:scale-90"
            title="Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-all active:scale-90"
            title="Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={rowRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
      >
        {tracks.map((track) => {
          const isThisCurrent = currentTrack?.id === track.id;
          const isThisPlaying = isThisCurrent && isPlaying;

          return (
            <div
              key={track.id}
              onClick={() => playTrack(track, tracks)}
              className="flex-shrink-0 w-36 sm:w-44 md:w-48 group cursor-pointer select-none snap-start"
            >
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-md bg-neutral-900 ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
                <img
                  src={track.thumbnail}
                  alt={track.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div
                  className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                    isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--theme-accent)] text-white flex items-center justify-center shadow-xl transform group-hover:scale-110 active:scale-95 transition-all">
                    {isThisPlaying ? (
                      <div className="flex gap-0.5 items-end h-3.5">
                        <span className="w-0.5 h-3.5 bg-white animate-pulse" />
                        <span className="w-0.5 h-2 bg-white animate-pulse delay-75" />
                        <span className="w-0.5 h-3.5 bg-white animate-pulse delay-150" />
                      </div>
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </div>
                </div>

                {track.duration && (
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[9.5px] font-mono text-white/90">
                    {track.duration}
                  </span>
                )}
              </div>

              <h3
                className={`text-sm font-semibold truncate mt-2 leading-snug transition-colors ${
                  isThisCurrent ? 'text-[var(--theme-accent)]' : 'text-white group-hover:text-white'
                }`}
                title={track.title}
              >
                {track.title}
              </h3>
              <p
                className="text-xs text-neutral-400 truncate mt-0.5 leading-tight"
                title={track.artist}
              >
                {track.artist}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const ListenNowView: React.FC<ListenNowViewProps> = ({ onOpenPlaylistModal }) => {
  const { 
    favorites, 
    history, 
    setActiveTab
  } = usePlayer();

  const [trendingTracks, setTrendingTracks] = useState<Track[]>(FALLBACK_TRENDING_TRACKS);
  const [viralTracks, setViralTracks] = useState<Track[]>([]);
  const [indonesiaTracks, setIndonesiaTracks] = useState<Track[]>([]);
  const [globalTracks, setGlobalTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadHomeData = async () => {
      setIsLoading(true);
      try {
        const [trending, viral, indo, global] = await Promise.all([
          getTrendingMusic('ID'),
          searchSongs("viral tiktok hits 2026"),
          searchSongs("lagu pop indonesia terbaru hits"),
          searchSongs("top billboard global hits")
        ]);

        if (isMounted) {
          if (trending.length > 0) setTrendingTracks(trending);
          if (viral.length > 0) setViralTracks(viral);
          if (indo.length > 0) setIndonesiaTracks(indo);
          if (global.length > 0) setGlobalTracks(global);
        }
      } catch (err) {
        console.warn("Error loading home songs:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadHomeData();
    return () => { isMounted = false; };
  }, []);

  const vanzTracks = useMemo(() => getVanzTeamTracks(), []);

  return (
    <div className="space-y-9 pb-36 animate-in fade-in duration-300 w-full max-w-7xl mx-auto">
      {/* Shelf 1: Lagu Populer & Trending */}
      <ShelfRow
        title="Lagu Populer & Trending"
        icon={<Flame className="w-5 h-5 text-[#fa2d48]" />}
        subtitle="Musik paling sering diputar dan sedang viral hari ini dari 200+ koleksi lagu Vanz"
        badge={isLoading ? 'Memuat lagu...' : `${trendingTracks.length} Lagu`}
        tracks={trendingTracks}
        onOpenPlaylistModal={onOpenPlaylistModal}
        onSeeAll={() => setActiveTab('recommendations')}
      />

      {/* Shelf 2: Viral TikTok & Reels */}
      {viralTracks.length > 0 && (
        <ShelfRow
          title="Viral TikTok & Reels 2026"
          icon={<Sparkles className="w-5 h-5 text-amber-400" />}
          subtitle="Lagu-lagu yang sedang naik daun dan viral di media sosial"
          badge={`${viralTracks.length} Lagu`}
          tracks={viralTracks}
          onOpenPlaylistModal={onOpenPlaylistModal}
          onSeeAll={() => setActiveTab('recommendations')}
        />
      )}

      {/* Shelf 3: Hits Pop Indonesia */}
      {indonesiaTracks.length > 0 && (
        <ShelfRow
          title="Hits Pop Indonesia Pilihan"
          icon={<Music2 className="w-5 h-5 text-purple-400" />}
          subtitle="Koleksi lagu pop dan galau terbaik dari musisi papan atas Indonesia"
          badge={`${indonesiaTracks.length} Lagu`}
          tracks={indonesiaTracks}
          onOpenPlaylistModal={onOpenPlaylistModal}
          onSeeAll={() => setActiveTab('recommendations')}
        />
      )}

      {/* Shelf 4: Top Global Hits */}
      {globalTracks.length > 0 && (
        <ShelfRow
          title="Top Global Hits"
          icon={<Globe2 className="w-5 h-5 text-cyan-400" />}
          subtitle="Tangga lagu internasional dan musisi dunia terpopuler"
          badge={`${globalTracks.length} Lagu`}
          tracks={globalTracks}
          onOpenPlaylistModal={onOpenPlaylistModal}
          onSeeAll={() => setActiveTab('recommendations')}
        />
      )}

      {/* Shelf 5: Baru Saja Diputar */}
      {history.length > 0 && (
        <ShelfRow
          title="Baru Saja Diputar"
          icon={<Clock className="w-5 h-5 text-indigo-400" />}
          subtitle="Daftar lagu yang baru kamu dengarkan di sesi ini"
          badge="Riwayat"
          tracks={history}
          onOpenPlaylistModal={onOpenPlaylistModal}
        />
      )}

      {/* Shelf 6: Favorit Anda */}
      {favorites.length > 0 && (
        <ShelfRow
          title="Lagu Favorit Anda"
          icon={<Heart className="w-5 h-5 text-rose-500 fill-rose-500" />}
          subtitle="Koleksi lagu yang telah kamu sukai"
          badge="Favorit"
          tracks={favorites}
          onOpenPlaylistModal={onOpenPlaylistModal}
          onSeeAll={() => setActiveTab('playlist')}
        />
      )}
    </div>
  );
};
