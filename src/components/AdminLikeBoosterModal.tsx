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
  RotateCcw,
  Sliders,
  ThumbsUp,
  MessageSquare,
  Trash2,
  CornerDownRight,
  Layers,
  Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  adminBoostSongLikes, 
  adminSetExactSongLikes, 
  subscribeSongLikes, 
  ADMIN_EMAIL 
} from '../lib/songLikeService';
import {
  getLocalVotes,
  subscribeCommunityVotes,
  adminBoostVoteItem,
  adminSetExactVoteItem,
  adminChangeVoteStatus,
  adminDeleteVoteItem,
  adminBoostReplyLikes,
  adminSetExactReplyLikes,
  adminDeleteReply,
  type CommunityVoteItem,
  type CommunityReply
} from '../lib/voteService';
import { FALLBACK_TRENDING_TRACKS, searchYouTubeMusic } from '../lib/youtube';
import { AdminVerifiedBadge } from './AdminVerifiedBadge';

export type AdminBoosterTab = 'voting' | 'comments' | 'song';

interface AdminLikeBoosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AdminBoosterTab;
  initialTrack?: Track | null;
  initialVoteItemId?: string;
  initialReplyId?: string;
}

export const AdminLikeBoosterModal: React.FC<AdminLikeBoosterModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'voting',
  initialTrack,
  initialVoteItemId,
  initialReplyId
}) => {
  const { user, isAdmin, currentTrack } = usePlayer();

  // Active Tab: 'voting' | 'comments' | 'song'
  const [activeTab, setActiveTab] = useState<AdminBoosterTab>(initialTab);

  // Status & Feedback
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // ==========================================
  // TAB 1: VOTING BOOSTER STATE
  // ==========================================
  const [votesList, setVotesList] = useState<CommunityVoteItem[]>(() => getLocalVotes());
  const [selectedVoteId, setSelectedVoteId] = useState<string>(initialVoteItemId || '');
  const [voteCustomAmount, setVoteCustomAmount] = useState<string>('100');
  const [voteExactAmount, setVoteExactAmount] = useState<string>('');

  // ==========================================
  // TAB 2: COMMENT / REPLY BOOSTER STATE
  // ==========================================
  const [selectedCommentTopicId, setSelectedCommentTopicId] = useState<string>(initialVoteItemId || '');
  const [selectedReplyId, setSelectedReplyId] = useState<string>(initialReplyId || '');
  const [replyCustomAmount, setReplyCustomAmount] = useState<string>('50');
  const [replyExactAmount, setReplyExactAmount] = useState<string>('');

  // ==========================================
  // TAB 3: SONG LIKE BOOSTER STATE
  // ==========================================
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(initialTrack || currentTrack || FALLBACK_TRENDING_TRACKS[0]);
  const [currentSongLikes, setCurrentSongLikes] = useState<number>(0);
  const [songCustomAmount, setSongCustomAmount] = useState<string>('100');
  const [songExactAmount, setSongExactAmount] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);

  // Sync tab and props on open
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
    if (initialVoteItemId) {
      setSelectedVoteId(initialVoteItemId);
      setSelectedCommentTopicId(initialVoteItemId);
    }
    if (initialReplyId) setSelectedReplyId(initialReplyId);
    if (initialTrack) setSelectedTrack(initialTrack);
    setStatusMessage(null);
  }, [initialTab, initialVoteItemId, initialReplyId, initialTrack, isOpen]);

  // Real-time subscribe to community votes
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeCommunityVotes((votes) => {
      setVotesList(votes);
      if (votes.length > 0) {
        if (!selectedVoteId) setSelectedVoteId(votes[0].id);
        if (!selectedCommentTopicId) setSelectedCommentTopicId(votes[0].id);
      }
    });
    return () => unsub();
  }, [isOpen]);

  // Subscribe to song likes
  useEffect(() => {
    if (!selectedTrack?.id || !isOpen) return;
    const unsub = subscribeSongLikes(selectedTrack.id, (likes) => {
      setCurrentSongLikes(likes);
    });
    return () => unsub();
  }, [selectedTrack?.id, isOpen]);

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
            Pusat Booster Admin ini dikhususkan hanya untuk akun Admin resmi ({ADMIN_EMAIL}). Akun Anda tidak memiliki izin.
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

  // Active Vote Item Object
  const activeVoteItem = votesList.find((v) => v.id === selectedVoteId) || votesList[0] || null;

  // Active Comment Topic & Active Reply
  const activeCommentTopic = votesList.find((v) => v.id === selectedCommentTopicId) || votesList[0] || null;
  const topicReplies = activeCommentTopic?.replies || [];
  const activeReply = topicReplies.find((r) => r.id === selectedReplyId) || topicReplies[0] || null;

  // =========================================================================
  // HANDLERS: VOTING BOOSTER
  // =========================================================================
  const handleBoostVote = async (amount: number) => {
    if (!activeVoteItem || isProcessing) return;
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const res = await adminBoostVoteItem(user, activeVoteItem.id, amount);
      if (res.success) {
        setStatusMessage({ text: `+${amount.toLocaleString('id-ID')} Vote berhasil ditambahkan ke "${activeVoteItem.title}"! Total: ${res.newCount.toLocaleString('id-ID')}`, type: 'success' });
      } else {
        setStatusMessage({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Gagal menambahkan vote', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomBoostVote = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(voteCustomAmount.replace(/\D/g, ''), 10);
    if (!isNaN(val) && val > 0) {
      handleBoostVote(val);
    }
  };

  const handleSetExactVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVoteItem || isProcessing) return;
    const val = parseInt(voteExactAmount.replace(/\D/g, ''), 10);
    if (isNaN(val) || val < 0) return;

    setIsProcessing(true);
    try {
      const res = await adminSetExactVoteItem(user, activeVoteItem.id, val);
      if (res.success) {
        setStatusMessage({ text: `Jumlah vote untuk "${activeVoteItem.title}" diatur ke ${val.toLocaleString('id-ID')}`, type: 'success' });
        setVoteExactAmount('');
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Gagal mengatur vote', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeStatus = async (newStatus: 'Direncanakan' | 'Dalam Proses' | 'Selesai') => {
    if (!activeVoteItem || isProcessing) return;
    setIsProcessing(true);
    try {
      const ok = await adminChangeVoteStatus(user, activeVoteItem.id, newStatus);
      if (ok) {
        setStatusMessage({ text: `Status usulan diubah menjadi "${newStatus}"`, type: 'success' });
      }
    } catch (e: any) {
      setStatusMessage({ text: e.message || 'Gagal mengubah status', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteVote = async () => {
    if (!activeVoteItem || isProcessing) return;
    if (!window.confirm(`Hapus usulan vote "${activeVoteItem.title}" beserta seluruh komentarnya?`)) return;
    setIsProcessing(true);
    try {
      await adminDeleteVoteItem(user, activeVoteItem.id);
      setStatusMessage({ text: `Usulan vote berhasil dihapus`, type: 'success' });
    } catch (e: any) {
      setStatusMessage({ text: e.message || 'Gagal menghapus', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // =========================================================================
  // HANDLERS: COMMENT BOOSTER
  // =========================================================================
  const handleBoostReply = async (amount: number) => {
    if (!activeCommentTopic || !activeReply || isProcessing) return;
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const res = await adminBoostReplyLikes(user, activeCommentTopic.id, activeReply.id, amount);
      if (res.success) {
        setStatusMessage({ text: `+${amount.toLocaleString('id-ID')} Like berhasil ditambahkan ke komentar ${activeReply.authorName}! Total: ${res.newCount.toLocaleString('id-ID')}`, type: 'success' });
      } else {
        setStatusMessage({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Gagal boost komentar', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomBoostReply = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(replyCustomAmount.replace(/\D/g, ''), 10);
    if (!isNaN(val) && val > 0) {
      handleBoostReply(val);
    }
  };

  const handleSetExactReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentTopic || !activeReply || isProcessing) return;
    const val = parseInt(replyExactAmount.replace(/\D/g, ''), 10);
    if (isNaN(val) || val < 0) return;

    setIsProcessing(true);
    try {
      const res = await adminSetExactReplyLikes(user, activeCommentTopic.id, activeReply.id, val);
      if (res.success) {
        setStatusMessage({ text: `Jumlah like komentar diatur ke ${val.toLocaleString('id-ID')}`, type: 'success' });
        setReplyExactAmount('');
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Gagal mengatur like komentar', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!activeCommentTopic || isProcessing) return;
    if (!window.confirm('Hapus komentar ini dari diskusi?')) return;
    setIsProcessing(true);
    try {
      await adminDeleteReply(user, activeCommentTopic.id, replyId);
      setStatusMessage({ text: 'Komentar berhasil dihapus', type: 'success' });
    } catch (e: any) {
      setStatusMessage({ text: e.message || 'Gagal menghapus komentar', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // =========================================================================
  // HANDLERS: SONG LIKE BOOSTER
  // =========================================================================
  const handleBoostSong = async (amount: number) => {
    if (!selectedTrack || isProcessing) return;
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const res = await adminBoostSongLikes(user, selectedTrack, amount);
      if (res.success) {
        setCurrentSongLikes(res.newCount);
        setStatusMessage({ text: `+${amount.toLocaleString('id-ID')} Like berhasil ditambahkan ke lagu "${selectedTrack.title}"! Total: ${res.newCount.toLocaleString('id-ID')}`, type: 'success' });
      } else {
        setStatusMessage({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Gagal boost lagu', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomBoostSong = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(songCustomAmount.replace(/\D/g, ''), 10);
    if (!isNaN(val) && val > 0) {
      handleBoostSong(val);
    }
  };

  const handleSetExactSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrack || isProcessing) return;
    const val = parseInt(songExactAmount.replace(/\D/g, ''), 10);
    if (isNaN(val) || val < 0) return;

    setIsProcessing(true);
    try {
      const res = await adminSetExactSongLikes(user, selectedTrack, val);
      if (res.success) {
        setCurrentSongLikes(res.newCount);
        setStatusMessage({ text: `Jumlah like lagu diatur ke ${val.toLocaleString('id-ID')}`, type: 'success' });
        setSongExactAmount('');
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
        className="w-full max-w-xl rounded-3xl bg-neutral-950/95 border border-amber-500/30 shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Admin */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-500/15 via-transparent to-rose-500/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white tracking-tight">Admin Booster Center</h3>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black shadow-sm">
                  <AdminVerifiedBadge className="w-3 h-3 text-black fill-current" />
                  Owner & Admin
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

        {/* 3 Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-white/10 bg-black/40 p-1.5 gap-1.5 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('voting'); setStatusMessage(null); }}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'voting'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Booster Voting</span>
          </button>

          <button
            onClick={() => { setActiveTab('comments'); setStatusMessage(null); }}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'comments'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Booster Komentar</span>
          </button>

          <button
            onClick={() => { setActiveTab('song'); setStatusMessage(null); }}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'song'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Booster Lagu</span>
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

          {/* ========================================================================= */}
          {/* TAB 1: BOOSTER VOTING (USULAN FITUR KOMUNITAS) */}
          {/* ========================================================================= */}
          {activeTab === 'voting' && (
            <div className="space-y-4">
              {/* Select Vote Topic */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Pilih Usulan / Topik Voting:</span>
                  <span className="text-amber-400 lowercase text-[10px]">Total {votesList.length} topik</span>
                </label>
                <select
                  value={selectedVoteId}
                  onChange={(e) => {
                    setSelectedVoteId(e.target.value);
                    setStatusMessage(null);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                >
                  {votesList.map((v) => (
                    <option key={v.id} value={v.id} className="bg-neutral-900 text-white">
                      [{v.status}] ({v.votes} Votes) - {v.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Voting Item Highlight Card */}
              {activeVoteItem ? (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3 relative overflow-hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          activeVoteItem.status === 'Selesai'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : activeVoteItem.status === 'Dalam Proses'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-white/10 text-neutral-300'
                        }`}>
                          {activeVoteItem.status}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-medium">
                          Oleh {activeVoteItem.authorName}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white leading-snug">
                        {activeVoteItem.title}
                      </h4>
                      {activeVoteItem.description && (
                        <p className="text-xs text-neutral-400 line-clamp-2">
                          {activeVoteItem.description}
                        </p>
                      )}
                    </div>

                    {/* Current Vote Count Display */}
                    <div className="text-right shrink-0 pl-2">
                      <span className="text-[10px] text-neutral-400 font-medium block">
                        Jumlah Vote
                      </span>
                      <div className="flex items-center justify-end gap-1.5 text-amber-400 font-black text-xl">
                        <ThumbsUp className="w-4 h-4 fill-current" />
                        <span>{activeVoteItem.votes.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Fast Actions (Change Status / Delete) */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-neutral-400">Ubah Status:</span>
                      {(['Direncanakan', 'Dalam Proses', 'Selesai'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleChangeStatus(st)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                            activeVoteItem.status === st
                              ? 'bg-amber-400 text-black'
                              : 'bg-white/5 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleDeleteVote}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-neutral-500">
                  Belum ada item voting tersedia.
                </div>
              )}

              {/* Quick Vote Booster Buttons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tombol Cepat Tambah Vote (Sekali Klik):</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-semibold">Tersinkron Real-time</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '+10 Vote', amount: 10, bg: 'bg-white/5 hover:bg-white/10 border-white/10 text-white' },
                    { label: '+50 Vote', amount: 50, bg: 'bg-white/5 hover:bg-white/10 border-white/10 text-white' },
                    { label: '+100 Vote', amount: 100, bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300' },
                    { label: '+500 Vote', amount: 500, bg: 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-200' },
                    { label: '+1.000 Vote', amount: 1000, bg: 'bg-amber-500/30 hover:bg-amber-500/40 border-amber-500/50 text-amber-100' },
                    { label: '+5.000 Vote', amount: 5000, bg: 'bg-gradient-to-r from-amber-500/40 to-amber-600/40 border-amber-400/50 text-white font-extrabold' },
                  ].map((btn) => (
                    <button
                      key={btn.amount}
                      type="button"
                      disabled={isProcessing || !activeVoteItem}
                      onClick={() => handleBoostVote(btn.amount)}
                      className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all active:scale-95 flex flex-col items-center justify-center gap-1 disabled:opacity-50 ${btn.bg}`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5 fill-current" />
                      <span>{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Vote Amount Input */}
              <form onSubmit={handleCustomBoostVote} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tambah Jumlah Vote Kustom:</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    placeholder="Misal: 250"
                    value={voteCustomAmount}
                    onChange={(e) => setVoteCustomAmount(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing || !voteCustomAmount || !activeVoteItem}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 shrink-0 disabled:opacity-50"
                  >
                    Boost Vote
                  </button>
                </div>
              </form>

              {/* Atur Jumlah Vote Tertentu (Exact Value) */}
              <form onSubmit={handleSetExactVote} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Atur Angka Vote Persis (Set Exact):</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder={`Setel angka persis (saat ini: ${activeVoteItem?.votes || 0})`}
                    value={voteExactAmount}
                    onChange={(e) => setVoteExactAmount(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing || voteExactAmount === '' || !activeVoteItem}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs transition-all shrink-0 disabled:opacity-50"
                  >
                    Terapkan
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: BOOSTER KOMENTAR / BALASAN */}
          {/* ========================================================================= */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Select Discussion Topic */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Pilih Topik Diskusi:
                </label>
                <select
                  value={selectedCommentTopicId}
                  onChange={(e) => {
                    setSelectedCommentTopicId(e.target.value);
                    const topic = votesList.find((v) => v.id === e.target.value);
                    if (topic && topic.replies && topic.replies.length > 0) {
                      setSelectedReplyId(topic.replies[0].id);
                    } else {
                      setSelectedReplyId('');
                    }
                    setStatusMessage(null);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                >
                  {votesList.map((v) => (
                    <option key={v.id} value={v.id} className="bg-neutral-900 text-white">
                      {v.title} ({v.replies?.length || 0} Komentar)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Target Reply / Comment */}
              {topicReplies.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-xs text-neutral-400 space-y-2">
                  <MessageSquare className="w-6 h-6 mx-auto text-neutral-500" />
                  <p>Topik ini belum memiliki komentar dari pengguna.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      Pilih Komentar yang Mau Di-Boost:
                    </label>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {topicReplies.map((reply) => {
                        const isSelected = reply.id === (activeReply?.id || '');
                        return (
                          <button
                            key={reply.id}
                            type="button"
                            onClick={() => {
                              setSelectedReplyId(reply.id);
                              setStatusMessage(null);
                            }}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-md'
                                : 'bg-white/[0.03] border-white/5 text-neutral-300 hover:bg-white/[0.06]'
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              {reply.authorPhoto ? (
                                <img
                                  src={reply.authorPhoto}
                                  alt={reply.authorName}
                                  className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-neutral-300 shrink-0 mt-0.5">
                                  {reply.authorName?.[0] || 'U'}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-white truncate">
                                    {reply.authorName}
                                  </span>
                                  {isSelected && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-black">
                                      Terpilih
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-neutral-400 line-clamp-1">
                                  {reply.content}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 text-rose-400 font-bold text-xs shrink-0 pl-1">
                              <Heart className="w-3.5 h-3.5 fill-current" />
                              <span>{(reply.likes || 0).toLocaleString('id-ID')}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Comment Card */}
                  {activeReply && (
                    <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold inline-flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-current" /> Target Komentar
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {activeReply.authorName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-rose-400 font-black text-sm">
                          <Heart className="w-4 h-4 fill-current" />
                          <span>{(activeReply.likes || 0).toLocaleString('id-ID')} Likes</span>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-300 bg-black/30 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                        "{activeReply.content}"
                      </p>

                      <div className="flex items-center justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteReply(activeReply.id)}
                          className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus Komentar Ini</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Comment Booster Buttons */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tombol Cepat Boost Like Komentar:</span>
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: '+10 Like', amount: 10, bg: 'bg-white/5 hover:bg-white/10 border-white/10 text-white' },
                        { label: '+50 Like', amount: 50, bg: 'bg-white/5 hover:bg-white/10 border-white/10 text-white' },
                        { label: '+100 Like', amount: 100, bg: 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-300' },
                        { label: '+500 Like', amount: 500, bg: 'bg-rose-500/25 hover:bg-rose-500/35 border-rose-500/40 text-rose-200' },
                        { label: '+1.000 Like', amount: 1000, bg: 'bg-rose-500/35 hover:bg-rose-500/45 border-rose-500/50 text-rose-100' },
                        { label: '+5.000 Like', amount: 5000, bg: 'bg-gradient-to-r from-rose-500/40 to-amber-500/40 border-rose-400/50 text-white font-extrabold' },
                      ].map((btn) => (
                        <button
                          key={btn.amount}
                          type="button"
                          disabled={isProcessing || !activeReply}
                          onClick={() => handleBoostReply(btn.amount)}
                          className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all active:scale-95 flex flex-col items-center justify-center gap-1 disabled:opacity-50 ${btn.bg}`}
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                          <span>{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Comment Booster Input */}
                  <form onSubmit={handleCustomBoostReply} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                    <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tambah Like Komentar Kustom:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100000"
                        placeholder="Misal: 75"
                        value={replyCustomAmount}
                        onChange={(e) => setReplyCustomAmount(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isProcessing || !replyCustomAmount || !activeReply}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 shrink-0 disabled:opacity-50"
                      >
                        Boost Like
                      </button>
                    </div>
                  </form>

                  {/* Set Exact Comment Likes */}
                  <form onSubmit={handleSetExactReply} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                    <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Atur Angka Like Komentar Persis (Set Exact):</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder={`Setel angka persis (saat ini: ${activeReply?.likes || 0})`}
                        value={replyExactAmount}
                        onChange={(e) => setReplyExactAmount(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isProcessing || replyExactAmount === '' || !activeReply}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs transition-all shrink-0 disabled:opacity-50"
                      >
                        Terapkan
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: BOOSTER LIKE LAGU */}
          {/* ========================================================================= */}
          {activeTab === 'song' && (
            <div className="space-y-4">
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
                          setStatusMessage(null);
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
                      <Flame className="w-3 h-3" /> Target Lagu
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
                      Jumlah Like
                    </span>
                    <div className="flex items-center justify-end gap-1.5 text-rose-400 font-black text-lg">
                      <Heart className="w-4 h-4 fill-current" />
                      <span>{currentSongLikes.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Booster Buttons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tombol Cepat Tambah Like Lagu:</span>
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
                      disabled={isProcessing || !selectedTrack}
                      onClick={() => handleBoostSong(btn.amount)}
                      className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all active:scale-95 flex flex-col items-center justify-center gap-1 disabled:opacity-50 ${btn.bg}`}
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span>{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Like Booster Amount */}
              <form onSubmit={handleCustomBoostSong} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tambah Like Lagu Kustom:</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    placeholder="Misal: 250"
                    value={songCustomAmount}
                    onChange={(e) => setSongCustomAmount(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing || !songCustomAmount || !selectedTrack}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 shrink-0 disabled:opacity-50"
                  >
                    Boost Lagu
                  </button>
                </div>
              </form>

              {/* Atur Jumlah Like Tertentu (Exact Value) */}
              <form onSubmit={handleSetExactSong} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Atur Angka Like Lagu Persis (Set Exact):</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder={`Setel angka persis (saat ini: ${currentSongLikes})`}
                    value={songExactAmount}
                    onChange={(e) => setSongExactAmount(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing || songExactAmount === '' || !selectedTrack}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs transition-all shrink-0 disabled:opacity-50"
                  >
                    Terapkan
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terotentikasi sebagai Developer Vanz Music</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};
