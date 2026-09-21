import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';
import { 
  ShieldCheck, 
  Sparkles, 
  Heart, 
  Zap, 
  X, 
  CheckCircle2, 
  Search, 
  Flame, 
  TrendingUp, 
  RotateCcw,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getSongLikes, 
  subscribeSongLikes, 
  adminBoostSongLikes, 
  adminSetExactSongLikes, 
  ADMIN_EMAIL 
} from '../lib/songLikeService';
import { FALLBACK_TRENDING_TRACKS, searchYouTubeMusic } from '../lib/youtube';

interface AdminLikeBoosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrack?: Track | null;
}

export const AdminLikeBoosterModal: React.FC<AdminLikeBoosterModalProps> = ({
  isOpen,
  onClose,
  initialTrack
}) => {
  const { user, isAdmin, currentTrack } = usePlayer();

  const [selectedTrack, setSelectedTrack] = useState<Track | null>(initialTrack || currentTrack || FALLBACK_TRENDING_TRACKS[0]);
  const [currentLikes, setCurrentLikes] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('100');
  const [exactAmount, setExactAmount] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);

  // Sync selected track on prop change
  useEffect(() => {
    if (initialTrack) {
      setSelectedTrack(initialTrack);
    } else if (currentTrack && !selectedTrack) {
      setSelectedTrack(currentTrack);
    }
  }, [initialTrack, currentTrack]);

  // Subscribe to realtime like counts for selected track
  useEffect(() => {
    if (!selectedTrack?.id) return;
    const unsub = subscribeSongLikes(selectedTrack.id, (likes) => {
      setCurrentLikes(likes);
    });
    return () => unsub();
  }, [selectedTrack?.id]);

  if (!isOpen) return null;

  // Strict Admin Guard
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="w-full max-w-md p-6 rounded-3xl bg-neutral-900 border border-red-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
            <X className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Akses Ditolak</h3>
          <p className="text-xs text-neutral-400">
            Fitur Booster Like ini dikhususkan hanya untuk akun Admin resmi ({ADMIN_EMAIL}). Akun Anda tidak memiliki izin.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const handleBoost = async (amount: number) => {
    if (!selectedTrack || isProcessing) return;
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const res = await adminBoostSongLikes(user, selectedTrack, amount);
      if (res.success) {
        setCurrentLikes(res.newCount);
        setStatusMessage({ text: `+${amount.toLocaleString('id-ID')} Like berhasil ditambahkan! Total: ${res.newCount.toLocaleString('id-ID')}`, type: 'success' });
      } else {
        setStatusMessage({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Gagal menambahkan like', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomBoost = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customAmount.replace(/\D/g, ''), 10);
    if (!isNaN(val) && val > 0) {
      handleBoost(val);
    }
  };

  const handleSetExact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrack || isProcessing) return;
    const val = parseInt(exactAmount.replace(/\D/g, ''), 10);
    if (isNaN(val) || val < 0) return;

    setIsProcessing(true);
    try {
      const res = await adminSetExactSongLikes(user, selectedTrack, val);
      if (res.success) {
        setCurrentLikes(res.newCount);
        setStatusMessage({ text: `Jumlah like diatur ke ${val.toLocaleString('id-ID')}`, type: 'success' });
        setExactAmount('');
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Gagal mengatur like', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearchSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await searchYouTubeMusic(searchQuery.trim());
      setSearchResults(res.slice(0, 6));
      setShowSearchDropdown(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-3xl bg-neutral-950/95 border border-amber-500/30 shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Admin */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-500/15 via-transparent to-rose-500/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white tracking-tight">Admin Like Booster</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black">
                  Khusus Owner
                </span>
              </div>
              <p className="text-[11px] text-amber-300/80 font-medium">
                {ADMIN_EMAIL}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          
          {/* Status Message Alert */}
          <AnimatePresence>
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
                  statusMessage.type === 'success' 
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusMessage.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search/Select Different Song */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Pilih Lagu yang Mau Di-Boost:
            </label>
            <form onSubmit={handleSearchSong} className="relative flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Cari judul lagu atau nama penyanyi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all disabled:opacity-40 shrink-0"
              >
                {isSearching ? '...' : 'Cari'}
              </button>
            </form>

            {/* Search Dropdown Results */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="p-2 rounded-2xl bg-neutral-900 border border-white/15 space-y-1 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] text-neutral-400 font-bold uppercase">
                  <span>Hasil Pencarian:</span>
                  <button 
                    type="button" 
                    onClick={() => setShowSearchDropdown(false)}
                    className="hover:text-white"
                  >
                    Tutup
                  </button>
                </div>
                {searchResults.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => {
                      setSelectedTrack(song);
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 text-left transition-colors group"
                  >
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="w-9 h-9 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-amber-300">
                        {song.title}
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate">
                        {song.artist}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Song Highlight Card */}
          {selectedTrack && (
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-4 relative overflow-hidden">
              <img
                src={selectedTrack.thumbnail}
                alt={selectedTrack.title}
                className="w-16 h-16 rounded-xl object-cover shadow-lg border border-white/10 shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold inline-flex items-center gap-1">
                  <Flame className="w-3 h-3" /> Target Booster
                </span>
                <h4 className="text-sm font-bold text-white truncate">
                  {selectedTrack.title}
                </h4>
                <p className="text-xs text-neutral-400 truncate">
                  {selectedTrack.artist}
                </p>
              </div>

              {/* Current Like Counter Badge */}
              <div className="text-right shrink-0 pl-2">
                <span className="text-[10px] text-neutral-400 font-medium block">
                  Jumlah Like Sekarang
                </span>
                <div className="flex items-center justify-end gap-1.5 text-rose-400 font-black text-lg">
                  <Heart className="w-4 h-4 fill-current" />
                  <span>{currentLikes.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Booster Buttons (Kalo Gabut) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Tombol Cepat Tambah Like (Sekali Klik):</span>
              </label>
              <span className="text-[10px] text-amber-400 font-semibold">Tersimpan ke Cloud</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '+10 Like', amount: 10, bg: 'bg-white/5 hover:bg-white/10 border-white/10 text-white' },
                { label: '+50 Like', amount: 50, bg: 'bg-white/5 hover:bg-white/10 border-white/10 text-white' },
                { label: '+100 Like', amount: 100, bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300' },
                { label: '+500 Like', amount: 500, bg: 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-200' },
                { label: '+1.000 Like', amount: 1000, bg: 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-200' },
                { label: '+5.000 Like', amount: 5000, bg: 'bg-gradient-to-r from-amber-500/30 to-rose-500/30 border-amber-400/40 text-white font-extrabold' },
              ].map((btn) => (
                <button
                  key={btn.amount}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleBoost(btn.amount)}
                  className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all active:scale-95 flex flex-col items-center justify-center gap-1 disabled:opacity-50 ${btn.bg}`}
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Like Booster Amount */}
          <form onSubmit={handleCustomBoost} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Tambah Jumlah Like Kustom:</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="100000"
                placeholder="Misal: 250"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
              />
              <button
                type="submit"
                disabled={isProcessing || !customAmount}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 shrink-0 disabled:opacity-50"
              >
                Boost Kustom
              </button>
            </div>
          </form>

          {/* Atur Jumlah Like Tertentu (Exact Value) */}
          <form onSubmit={handleSetExact} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
              <span>Atur Angka Like Persis (Set Exact):</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                placeholder={`Setel angka persis (saat ini: ${currentLikes})`}
                value={exactAmount}
                onChange={(e) => setExactAmount(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
              />
              <button
                type="submit"
                disabled={isProcessing || exactAmount === ''}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs transition-all shrink-0 disabled:opacity-50"
              >
                Terapkan
              </button>
            </div>
          </form>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terotentikasi sebagai Developer Vanz Music</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};
