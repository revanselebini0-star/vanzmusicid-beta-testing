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

  const [activeSubTab, setActiveSubTab] = useState<'playlists' | 'favorites' | 'history'>('playlists');
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
            <span>{playlists.length} Playlist</span>
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

      {/* Detail View for a Specific Playlist */}
      {currentSelectedPlaylist ? (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedPlaylist(null)}
            className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-[#fa2d48] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Semua Playlist
          </button>

          {/* Playlist Info Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-3xl apple-glass border border-black/10 dark:border-white/10">
            <div className="w-36 h-36 rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/10 dark:ring-white/10 shrink-0">
              <img
                src={currentSelectedPlaylist.coverImage || 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg'}
                alt={currentSelectedPlaylist.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#fa2d48]">
                Daftar Putar Pribadi
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white truncate mt-1">
                {currentSelectedPlaylist.name}
              </h2>
              {currentSelectedPlaylist.description && (
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {currentSelectedPlaylist.description}
                </p>
              )}
              <p className="text-xs text-neutral-400 mt-2">
                {currentSelectedPlaylist.tracks.length} lagu • Disimpan di IndexedDB
              </p>

              {/* Actions: Play all, Shuffle, Delete */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  disabled={currentSelectedPlaylist.tracks.length === 0}
                  onClick={() => handlePlayAll(currentSelectedPlaylist.tracks)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#fa2d48] hover:bg-[#e0263f] disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-[#fa2d48]/30 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Putar Semua</span>
                </button>

                <button
                  disabled={currentSelectedPlaylist.tracks.length === 0}
                  onClick={() => handlePlayAll(currentSelectedPlaylist.tracks, true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 disabled:opacity-50 text-neutral-800 dark:text-neutral-200 font-bold text-xs transition-all cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Acak</span>
                </button>

                <button
                  onClick={async () => {
                    if (confirm(`Hapus daftar putar "${currentSelectedPlaylist.name}"?`)) {
                      await deletePlaylistAction(currentSelectedPlaylist.id);
                      setSelectedPlaylist(null);
                    }
                  }}
                  className="p-2.5 rounded-full text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ml-auto"
                  title="Hapus Playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tracks in Playlist */}
          <div className="space-y-1">
            {currentSelectedPlaylist.tracks.map((track, idx) => (
              <div
                key={`${track.id}-${idx}`}
                onClick={() => playTrack(track, currentSelectedPlaylist.tracks)}
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

                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 hidden sm:block mr-2">{track.duration}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSongFromPlaylistAction(currentSelectedPlaylist.id, track.id);
                    }}
                    className="p-2 rounded-full text-neutral-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    title="Hapus dari Playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {currentSelectedPlaylist.tracks.length === 0 && (
              <div className="py-16 text-center">
                <ListMusic className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Daftar putar ini masih kosong
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Cari lagu di tab Telusuri atau Pencarian, lalu klik tombol (+) untuk menambahkan lagu ke sini.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Sub tabs: Playlists / Favorites / History */
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-3">
            <button
              onClick={() => setActiveSubTab('playlists')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeSubTab === 'playlists'
                  ? 'bg-[#fa2d48] text-white shadow-md shadow-[#fa2d48]/25'
                  : 'bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Daftar Putar ({playlists.length})</span>
            </button>

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

          {/* Sub Tab: Playlists */}
          {activeSubTab === 'playlists' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Daftar Putar Tersimpan di IndexedDB
                </h2>
                <button
                  id="create-playlist-btn"
                  onClick={onCreatePlaylistClick}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#fa2d48] text-white shadow-md shadow-[#fa2d48]/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Playlist Baru</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Create Card */}
                <div
                  onClick={onCreatePlaylistClick}
                  className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-[#fa2d48]/40 hover:border-[#fa2d48] hover:bg-[#fa2d48]/5 transition-all cursor-pointer text-center aspect-square"
                >
                  <div className="w-12 h-12 rounded-full bg-[#fa2d48]/10 text-[#fa2d48] flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    Buat Playlist Baru
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-1">IndexedDB Local</span>
                </div>

                {/* Playlist Cards */}
                {playlists.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => setSelectedPlaylist(pl)}
                    className="apple-card group relative p-3 rounded-3xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer transition-all border border-transparent hover:border-black/5 dark:hover:border-white/10"
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-md">
                      <img
                        src={pl.coverImage || 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg'}
                        alt={pl.name}
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
                      {pl.name}
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {pl.tracks.length} lagu
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
      )}
    </div>
  );
};
