import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';
import { X, Plus, Check, ListMusic, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackToAdd?: Track | null;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({ isOpen, onClose, trackToAdd }) => {
  const { playlists, createPlaylist, addSongToPlaylistAction } = usePlayer();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const created = await createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    if (trackToAdd) {
      await addSongToPlaylistAction(created.id, trackToAdd);
    }
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setIsCreatingNew(false);
    onClose();
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!trackToAdd) return;
    await addSongToPlaylistAction(playlistId, trackToAdd);
    setAddedPlaylistId(playlistId);
    setTimeout(() => {
      setAddedPlaylistId(null);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md apple-glass rounded-3xl p-6 shadow-2xl border border-black/10 dark:border-white/15 relative overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
          {trackToAdd ? 'Tambahkan ke Daftar Putar' : 'Buat Daftar Putar Baru'}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">
          Tersimpan aman di IndexedDB (tersedia saat offline)
        </p>

        {trackToAdd && (
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 mb-4">
            <img 
              src={trackToAdd.thumbnail} 
              alt={trackToAdd.title} 
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                {trackToAdd.title}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                {trackToAdd.artist}
              </p>
            </div>
          </div>
        )}

        {/* Existing Playlists list */}
        {trackToAdd && !isCreatingNew && (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mb-4">
            {playlists.map((pl) => {
              const hasTrack = pl.tracks.some(t => t.id === trackToAdd.id);
              const isJustAdded = addedPlaylistId === pl.id;

              return (
                <button
                  key={pl.id}
                  onClick={() => handleAddToPlaylist(pl.id)}
                  disabled={hasTrack || isJustAdded}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all ${
                    hasTrack 
                      ? 'opacity-60 bg-black/5 dark:bg-white/5 cursor-default' 
                      : 'hover:bg-[#fa2d48]/10 hover:border-[#fa2d48]/30 border border-transparent bg-black/5 dark:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#fa2d48] to-[#ff5268] flex items-center justify-center text-white shrink-0">
                      <ListMusic className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {pl.name}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {pl.tracks.length} lagu
                      </p>
                    </div>
                  </div>

                  {hasTrack ? (
                    <span className="text-[10px] text-neutral-400 font-medium">Sudah ada</span>
                  ) : isJustAdded ? (
                    <span className="text-xs text-emerald-500 flex items-center gap-1 font-semibold">
                      <Check className="w-3.5 h-3.5" /> Ditambahkan
                    </span>
                  ) : (
                    <Plus className="w-4 h-4 text-[#fa2d48]" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Form create new playlist */}
        {isCreatingNew || !trackToAdd ? (
          <form onSubmit={handleCreateNew} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Nama Daftar Putar
              </label>
              <input
                type="text"
                required
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Contoh: Lagu Senja, Chill Workout..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fa2d48]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Deskripsi (Opsional)
              </label>
              <input
                type="text"
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                placeholder="Koleksi lagu favorit pribadi"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fa2d48]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              {trackToAdd && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Kembali
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[#fa2d48] hover:bg-[#e0263f] text-white shadow-md shadow-[#fa2d48]/25 transition-all"
              >
                Buat & Simpan
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreatingNew(true)}
            className="w-full py-3 rounded-2xl border border-dashed border-[#fa2d48]/50 text-[#fa2d48] text-xs font-semibold hover:bg-[#fa2d48]/5 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Playlist Baru</span>
          </button>
        )}
      </motion.div>
    </div>
  );
};
