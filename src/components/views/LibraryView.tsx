import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { Playlist, Track } from '../../types';
import { 
  Heart, 
  ListMusic, 
  Clock, 
  Plus, 
  Play, 
  Trash2, 
  Shuffle, 
  FolderHeart, 
  Database, 
  User as UserIcon,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface LibraryViewProps {
  onCreatePlaylistClick: () => void;
  onOpenPlaylistModal: (track: Track) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ 
  onCreatePlaylistClick,
  onOpenPlaylistModal
}) => {
  const { 
    favorites, 
    playlists, 
    history, 
    playTrack, 
    toggleFavoriteAction, 
    removeSongFromPlaylistAction, 
    deletePlaylistAction,
    user,
    signInWithGoogleAction
  } = usePlayer();

  const [activeSubTab, setActiveSubTab] = useState<'favorites' | 'history'>('favorites');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  // Sync selectedPlaylist with updated playlists from context
  const currentSelectedPlaylist = selectedPlaylist 
    ? playlists.find(p => p.id === selectedPlaylist.id) || null
    : null;

  const handlePlayAll = (tracks: Track[], shuffle = false) => {
    if (tracks.length === 0) return;
    let list = [...tracks];
    if (shuffle) {
      list = list.sort(() => Math.random() - 0.5);
    }
    playTrack(list[0], list);
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-300">
      {/* Header & User Profile / Login status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-1">
            Perpustakaan Saya
          </h1>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <Database className="w-3.5 h-3.5" />
              IndexedDB Aktif (Offline Ready)
            </span>
            <span>•</span>
            <span>{favorites.length} Favorit</span>
          </div>
        </div>

        {!user ? (
          <button
            onClick={signInWithGoogleAction}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold bg-black/5 dark:bg-white/10 hover:bg-[#fa2d48] hover:text-white text-neutral-800 dark:text-neutral-200 border border-black/10 dark:border-white/10 transition-all self-start sm:self-auto cursor-pointer"
          >
            <UserIcon className="w-4 h-4 text-[#fa2d48]" />
            <span>Masuk Google untuk Sinkronisasi</span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold self-start sm:self-auto">
            <span>Tersambung: {user.displayName || user.email}</span>
          </div>
        )}
      </div>

      {/* Sub tabs: Favorites / History */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-3">
          <button
            onClick={() => setActiveSubTab('favorites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeSubTab === 'favorites'
                ? 'bg-[#fa2d48] text-white shadow-md shadow-[#fa2d48]/25'
                : 'bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Favorit ({favorites.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeSubTab === 'history'
                ? 'bg-[#fa2d48] text-white shadow-md shadow-[#fa2d48]/25'
                : 'bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Riwayat ({history.length})</span>
          </button>
        </div>

        {/* Tab content area */}
        <div>
          {/* Sub Tab: Favorites */}
          {activeSubTab === 'favorites' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    Lagu Favorit
                  </h2>
                  <p className="text-xs text-neutral-400">{favorites.length} lagu ditandai suka</p>
                </div>

                {favorites.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePlayAll(favorites)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#fa2d48] text-white shadow-md shadow-[#fa2d48]/25 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Putar Semua</span>
                    </button>
                    <button
                      onClick={() => handlePlayAll(favorites, true)}
                      className="p-2 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-black/10"
                      title="Acak"
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {favorites.length > 0 ? (
                <div className="space-y-1">
                  {favorites.map((track, idx) => (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track, favorites)}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <span className="w-5 text-center text-xs font-bold text-neutral-400">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover shadow-sm shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {track.title}
                          </p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="flex items-center gap-2"
                      >
                        <button
                          onClick={() => toggleFavoriteAction(track)}
                          className="p-2 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Hapus dari Favorit"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>

                        <button
                          onClick={() => onOpenPlaylistModal(track)}
                          className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                          title="Tambah ke Playlist"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <FolderHeart className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Belum ada lagu favorit
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Klik ikon hati (♡) pada lagu manapun untuk menyimpannya di sini.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sub Tab: History */}
          {activeSubTab === 'history' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Riwayat Pemutaran Terakhir
                </h2>
                <p className="text-xs text-neutral-400">Tersimpan otomatis di IndexedDB browser Anda</p>
              </div>

              {history.length > 0 ? (
                <div className="space-y-1">
                  {history.map((track, idx) => (
                    <div
                      key={`hist-${track.id}-${idx}`}
                      onClick={() => playTrack(track, history)}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <span className="w-5 text-center text-xs font-bold text-neutral-400">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover shadow-sm shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {track.title}
                          </p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="flex items-center gap-2"
                      >
                        <button
                          onClick={() => onOpenPlaylistModal(track)}
                          className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                          title="Tambah ke Playlist"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <Clock className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Belum ada riwayat musik
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
