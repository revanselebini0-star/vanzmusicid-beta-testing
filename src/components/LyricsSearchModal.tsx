import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { LyricsSearchCandidate } from '../types';
import { searchLyricsManual, applyCandidateLyrics, saveUserManualLyrics } from '../lib/lyricsService';
import { 
  Search, 
  X, 
  Check, 
  Sparkles, 
  FileText, 
  Clock, 
  ExternalLink,
  Edit3,
  RotateCcw
} from 'lucide-react';

interface LyricsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LyricsSearchModal: React.FC<LyricsSearchModalProps> = ({ isOpen, onClose }) => {
  const { currentTrack, updateLyricsResult, reloadLyrics } = usePlayer();

  const [mode, setMode] = useState<'search' | 'paste'>('search');
  const [searchQuery, setSearchQuery] = useState(() => {
    if (currentTrack) {
      return `${currentTrack.title} ${currentTrack.artist}`.replace(/Artis Populer/gi, '').trim();
    }
    return '';
  });
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<LyricsSearchCandidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [manualText, setManualText] = useState('');
  const [applyingId, setApplyingId] = useState<string | number | null>(null);

  if (!isOpen || !currentTrack) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const candidates = await searchLyricsManual(searchQuery.trim());
      setResults(candidates);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCandidate = async (candidate: LyricsSearchCandidate) => {
    setApplyingId(candidate.id);
    try {
      const result = await applyCandidateLyrics(
        candidate, 
        currentTrack.id, 
        currentTrack.durationSeconds || 210
      );
      updateLyricsResult(result);
      onClose();
    } catch (err) {
      console.error('Failed to apply lyrics:', err);
    } finally {
      setApplyingId(null);
    }
  };

  const handleSaveManualText = async () => {
    if (!manualText.trim()) return;
    try {
      const result = await saveUserManualLyrics(
        manualText.trim(),
        currentTrack.id,
        currentTrack.title,
        currentTrack.artist,
        currentTrack.durationSeconds || 210
      );
      updateLyricsResult(result);
      onClose();
    } catch (err) {
      console.error('Failed to save manual lyrics:', err);
    }
  };

  const handleResetToAuto = async () => {
    try {
      const { deleteSavedLyrics } = await import('../lib/indexedDB');
      await deleteSavedLyrics(currentTrack.id);
      await reloadLyrics();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-white"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#fa2d48]" />
              Cari Lirik Asli & Akurat
            </h2>
            <p className="text-xs text-white/50 truncate max-w-sm mt-0.5">
              Untuk: <span className="text-white/80 font-medium">{currentTrack.title}</span> • {currentTrack.artist}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Cari Online vs Tempel Manual */}
        <div className="flex border-b border-white/10 bg-black/20 p-1.5 gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setMode('search')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'search' 
                ? 'bg-[#fa2d48] text-white shadow-md' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Cari di Database Resmi (LRCLIB)</span>
          </button>
          <button
            onClick={() => setMode('paste')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'paste' 
                ? 'bg-[#fa2d48] text-white shadow-md' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Tempel Teks / LRC</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {mode === 'search' ? (
            <>
              {/* Search Form */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Judul lagu atau nama penyanyi..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#fa2d48] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-4 py-2.5 rounded-2xl bg-[#fa2d48] hover:bg-[#e0263f] disabled:opacity-50 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  {isSearching ? 'Mencari...' : 'Cari'}
                </button>
              </form>

              {/* Results */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between text-[11px] text-white/50 pb-1">
                  <span>Hasil Pencarian Lirik Resmi</span>
                  {results.length > 0 && <span>{results.length} ditemukan</span>}
                </div>

                {isSearching ? (
                  <div className="py-12 text-center text-white/70 text-xs">
                    <div className="w-6 h-6 border-2 border-[#fa2d48] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span className="animate-pulse font-medium">sabar ya !</span>
                  </div>
                ) : results.length > 0 ? (
                  results.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectCandidate(item)}
                      className="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-[#fa2d48]/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-white truncate">
                            {item.trackName}
                          </p>
                          {item.isSynced ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Sinkron Waktu (LRC)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/60">
                              Teks Polos
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/60 truncate mt-0.5">
                          {item.artistName} {item.albumName ? `• ${item.albumName}` : ''}
                        </p>
                      </div>

                      <button
                        disabled={applyingId === item.id}
                        className="px-3 py-1.5 rounded-xl bg-white/10 group-hover:bg-[#fa2d48] text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1"
                      >
                        {applyingId === item.id ? (
                          'Menerapkan...'
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Pilih</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))
                ) : hasSearched ? (
                  <div className="py-12 text-center text-white/50 text-xs">
                    <FileText className="w-8 h-8 text-white/30 mx-auto mb-2" />
                    <p className="font-semibold text-white/80">Tidak ada lirik yang cocok</p>
                    <p className="mt-1">Coba sesuaikan kata kunci pencarian (misal hanya judul lagu tanpa kata tambahan), atau beralih ke tab "Tempel Teks / LRC".</p>
                  </div>
                ) : (
                  <div className="py-8 text-center text-white/40 text-xs">
                    Ketik judul lagu dan klik tombol <b>Cari</b> untuk menemukan lirik resmi yang pas.
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Paste Manual LRC / Text Mode */
            <div className="space-y-3">
              <div className="text-xs text-white/60 space-y-1">
                <p>Tempel lirik lagu secara manual di bawah ini.</p>
                <p className="text-[11px] text-white/40">
                  Mendukung format lirik sinkron <code>[00:15.30] teks lirik</code> maupun baris teks biasa.
                </p>
              </div>

              <textarea
                rows={9}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="[00:12.50] Baris lirik pertama&#10;[00:16.80] Baris lirik kedua..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 text-xs sm:text-sm font-mono text-white placeholder-white/30 focus:outline-none focus:border-[#fa2d48] transition-colors resize-none"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleSaveManualText}
                  disabled={!manualText.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-[#fa2d48] hover:bg-[#e0263f] disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#fa2d48]/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Lirik Ini</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info & Reset */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-white/50">
          <div className="flex items-center gap-1 text-[11px]">
            <span>Sumber Resmi: LRCLIB API</span>
          </div>

          <button
            onClick={handleResetToAuto}
            className="flex items-center gap-1 text-[11px] text-white/60 hover:text-rose-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ke Deteksi Otomatis</span>
          </button>
        </div>
      </div>
    </div>
  );
};
