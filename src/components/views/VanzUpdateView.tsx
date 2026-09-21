import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { 
  ThumbsUp, 
  MessageSquare, 
  Send, 
  Plus, 
  Compass, 
  Flame, 
  LogIn, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Wrench, 
  RefreshCw, 
  User as UserIcon, 
  CornerDownRight, 
  X,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const VANZ_LOGO = 'https://cdn.phototourl.com/free/2026-09-19-571b25e0-aa49-47c1-9fa7-8f7127a2a4cd.png';

export interface CommunityReply {
  id: string;
  authorName: string;
  authorPhoto?: string;
  authorEmail?: string;
  userId: string;
  content: string;
  createdAt: number;
}

export interface CommunityVoteItem {
  id: string;
  title: string;
  description?: string;
  authorName: string;
  authorPhoto?: string;
  authorEmail?: string;
  userId: string;
  createdAt: number;
  votes: number;
  voters: string[];
  status: 'Direncanakan' | 'Dalam Proses' | 'Selesai';
  replies: CommunityReply[];
}

interface PatchHighlight {
  type: 'feature' | 'fix' | 'performance';
  text: string;
}

interface PatchRelease {
  id: string;
  version: string;
  releaseDate: string;
  title: string;
  tag: 'Major' | 'Patch' | 'Optimasi';
  isLatest?: boolean;
  summary: string;
  highlights: PatchHighlight[];
}

function formatRelativeDate(timestamp: number): string {
  if (!timestamp) return 'Baru saja';
  const now = Date.now();
  const diff = now - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'Baru saja';
  if (diff < hour) return `${Math.floor(diff / minute)} menit yang lalu`;
  if (diff < day) return `${Math.floor(diff / hour)} jam yang lalu`;
  if (diff < 2 * day) return 'Kemarin';

  const date = new Date(timestamp);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatExactDate(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export const VanzUpdateView: React.FC = () => {
  const { user, signInWithGoogleAction, isAuthLoading } = usePlayer();

  // Patch releases (Preserving user modifications)
  const releases: PatchRelease[] = [
    {
      id: '2.5.0 Beta',
      version: 'v2.5.0 Beta Testing',
      releaseDate: '20 September 2026',
      title: 'Dark Liquid Glass Navigation & Responsive Dock',
      tag: 'Patch',
      isLatest: true,
      summary: 'Pembaruan antarmuka navigasi mobile bergaya kaca gelap transparan (*Dark Liquid Glass*) yang menyatu anggun dengan konten musik, disertai responsivitas auto-hide yang mulus.',
      highlights: [
        {
          type: 'feature',
          text: 'Navbar bawah mobile dengan estetika kaca hitam bening (backdrop-blur-2xl, backdrop-saturate-150) dan pantulan specular halus.'
        },
        {
          type: 'feature',
          text: 'Perilaku pintar saat scroll: Navbar meluncur tersembunyi saat menggulir ke bawah, dan Mini Player otomatis merapat ke dasar layar tanpa menumpuk konten.'
        },
        {
          type: 'feature',
          text: 'Halaman Vanz Update resmi untuk melihat riwayat log rilis serta roadmap fitur yang dapat divote pengguna.'
        },
        {
          type: 'fix',
          text: 'Memperbaiki benturan styling positioning CSS yang sempat menyebabkan navbar terlempar ke bawah konten.'
        }
      ]
    }
  ];

  // Community Votes State (Real-time sync)
  const [votesList, setVotesList] = useState<CommunityVoteItem[]>([]);
  const [isLoadingVotes, setIsLoadingVotes] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPromptReason, setLoginPromptReason] = useState<string>('untuk memberikan vote');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const isPollingRef = useRef(false);

  // Fetch votes from server
  const fetchVotes = async (isBackground = false) => {
    if (!isBackground) setIsSyncing(true);
    try {
      const res = await fetch('/api/community-votes');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setVotesList(data);
        }
      }
    } catch (e) {
      console.warn('Real-time sync notice: using current local memory', e);
    } finally {
      setIsLoadingVotes(false);
      if (!isBackground) setIsSyncing(false);
    }
  };

  // Real-time polling effect (Every 4 seconds for sub-second community updates)
  useEffect(() => {
    fetchVotes(false);

    const interval = setInterval(() => {
      if (!isPollingRef.current) {
        isPollingRef.current = true;
        fetchVotes(true).finally(() => {
          isPollingRef.current = false;
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const triggerLoginNotice = (actionText: string) => {
    setLoginPromptReason(actionText);
    setShowLoginModal(true);
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogleAction();
      setShowLoginModal(false);
      setFeedbackNotice('Berhasil masuk dengan akun Google!');
      setTimeout(() => setFeedbackNotice(null), 3000);
    } catch (err: any) {
      console.error('Login error:', err);
    }
  };

  // Handle Upvote / Unvote
  const handleToggleVote = async (itemId: string) => {
    if (!user) {
      triggerLoginNotice('untuk memberikan vote pada usulan fitur');
      return;
    }

    // Optimistic update
    setVotesList((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const voters = Array.isArray(item.voters) ? [...item.voters] : [];
          const hasVoted = voters.includes(user.uid);
          const newVoters = hasVoted
            ? voters.filter((id) => id !== user.uid)
            : [...voters, user.uid];
          return {
            ...item,
            votes: hasVoted ? Math.max(0, item.votes - 1) : item.votes + 1,
            voters: newVoters
          };
        }
        return item;
      })
    );

    try {
      const res = await fetch(`/api/community-votes/${itemId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          authorName: user.displayName || user.email?.split('@')[0] || 'Pengguna'
        })
      });
      if (res.ok) {
        const updatedItem = await res.json();
        setVotesList((prev) =>
          prev.map((item) => (item.id === itemId ? updatedItem : item))
        );
      }
    } catch (e) {
      console.error('Failed to vote:', e);
      fetchVotes(true); // Re-sync on failure
    }
  };

  // Handle Create New Vote Post
  const handleCreateVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      triggerLoginNotice('untuk membuat usulan fitur & membuka vote');
      return;
    }

    if (!newTitle.trim()) return;
    setIsSubmittingVote(true);

    try {
      const res = await fetch('/api/community-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          authorName: user.displayName || user.email?.split('@')[0] || 'Pengguna Vanz',
          authorPhoto: user.photoURL || '',
          authorEmail: user.email || '',
          userId: user.uid
        })
      });

      if (res.ok) {
        const created = await res.json();
        setVotesList((prev) => [created, ...prev]);
        setNewTitle('');
        setNewDesc('');
        setShowSuggestForm(false);
        setFeedbackNotice('Usulan vote berhasil dipublikasikan secara real-time!');
        setTimeout(() => setFeedbackNotice(null), 3500);
      }
    } catch (e) {
      console.error('Error creating vote:', e);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // Handle Send Reply / Comment to a Vote Item
  const handleSendReply = async (itemId: string) => {
    if (!user) {
      triggerLoginNotice('untuk membalas komentar atau ikut berdiskusi');
      return;
    }

    const replyContent = (replyTextMap[itemId] || '').trim();
    if (!replyContent) return;

    setSubmittingReplyId(itemId);

    try {
      const res = await fetch(`/api/community-votes/${itemId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          authorName: user.displayName || user.email?.split('@')[0] || 'Pengguna Vanz',
          authorPhoto: user.photoURL || '',
          authorEmail: user.email || '',
          userId: user.uid
        })
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setVotesList((prev) =>
          prev.map((item) => (item.id === itemId ? updatedItem : item))
        );
        setReplyTextMap((prev) => ({ ...prev, [itemId]: '' }));
      }
    } catch (e) {
      console.error('Failed to submit reply:', e);
    } finally {
      setSubmittingReplyId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="max-w-2xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 pb-52 sm:pb-44 text-neutral-200"
    >
      {/* Toast Feedback Notification */}
      <AnimatePresence>
        {feedbackNotice && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-emerald-500/90 text-black text-[11px] sm:text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none max-w-[90vw]"
          >
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{feedbackNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editorial Header - Mobile-Optimized with direct auth status */}
      <header className="pb-5 sm:pb-8 border-b border-white/[0.08]">
        <div className="flex items-start justify-between gap-2.5 sm:gap-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden ring-1 ring-white/15 bg-black/40 shadow-xl shrink-0">
              <img 
                src={VANZ_LOGO} 
                alt="Vanz Music" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-none">
                  Vanz Update
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  v2.5.0 Beta Testing
                </span>
              </div>
              <p className="text-[11px] sm:text-sm text-neutral-400 leading-snug">
                Riwayat rilis resmi, log pembaruan sistem, dan vote roadmap fitur komunitas real-time.
              </p>
            </div>
          </div>

          {/* User Auth Status Pill (Visible on both mobile HP and desktop) */}
          <div className="shrink-0 pt-0.5">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Akun'}
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover ring-1 ring-white/30"
                  />
                ) : (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[var(--theme-accent)] flex items-center justify-center text-[9px] font-bold text-white">
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
                <span className="text-neutral-200 font-medium max-w-[70px] sm:max-w-[110px] truncate hidden xs:inline text-[11px] sm:text-xs">
                  {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
              </div>
            ) : (
              <button
                onClick={() => triggerLoginNotice('untuk memberikan vote dan berdiskusi')}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap"
              >
                <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Masuk</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Clean Timeline: Release History */}
      <section className="py-6 sm:py-8 space-y-8 sm:space-y-12">
        {releases.map((rel) => (
          <article key={rel.id} className="relative pl-5 sm:pl-8 border-l border-white/[0.12] space-y-2.5 sm:space-y-3 group">
            {/* Timeline Node Marker */}
            <div className="absolute -left-[6.5px] top-1.5 w-3 h-3 rounded-full border-2 border-[#121214] bg-[var(--theme-accent)] shadow-sm shadow-[var(--theme-glow)] scale-110" />

            {/* Version & Date Metadata */}
            <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-start">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-mono font-extrabold text-white tracking-tight">
                  {rel.version}
                </span>

                <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider text-neutral-400 bg-white/[0.06]">
                  {rel.tag}
                </span>

                {rel.isLatest && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] border border-[var(--theme-accent)]/30 flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-current" />
                    Rilis Terbaru
                  </span>
                )}
              </div>

              <span className="text-[11px] sm:text-xs text-neutral-500 sm:ml-auto">
                {rel.releaseDate}
              </span>
            </div>

            {/* Title & Narrative */}
            <div className="space-y-1">
              <h2 className="text-sm sm:text-lg font-bold text-neutral-100 leading-snug">
                {rel.title}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                {rel.summary}
              </p>
            </div>

            {/* Clean Highlight List */}
            <ul className="pt-1.5 space-y-2">
              {rel.highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-300">
                  <span className="mt-1.5 shrink-0">
                    {item.type === 'feature' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block" />}
                    {item.type === 'fix' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 block" />}
                    {item.type === 'performance' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 block" />}
                  </span>
                  <span className="leading-relaxed">{item.text}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      {/* REAL-TIME COMMUNITY VOTE & DISCUSSION SECTION */}
      <section className="pt-6 sm:pt-8 border-t border-white/[0.08] space-y-4 sm:space-y-6">
        {/* Section Header */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[var(--theme-accent)] shrink-0" />
              <h2 className="text-sm sm:text-lg font-bold text-white tracking-tight">
                Vote Komunitas Realtime
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fetchVotes(false)}
                disabled={isSyncing}
                title="Sinkronisasi data terbaru"
                className="p-1.5 sm:p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.06] active:bg-white/10 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[var(--theme-accent)]' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs text-neutral-400 flex-1 pr-2">
              Kirim ide fitur baru atau vote usulan yang sedang dirancang.
            </p>

            {user ? (
              <button
                onClick={() => setShowSuggestForm(!showSuggestForm)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 text-white transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Usulkan Vote</span>
              </button>
            ) : (
              <button
                onClick={() => triggerLoginNotice('untuk mengusulkan fitur atau vote baru')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--theme-accent)] text-white shadow-sm shadow-[var(--theme-glow)] hover:opacity-90 active:scale-95 transition-all shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login untuk Vote</span>
              </button>
            )}
          </div>
        </div>

        {/* Current User Active Notice Bar on Mobile */}
        {user && (
          <div className="sm:hidden flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || ''}
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-neutral-400" />
              )}
              <span className="text-neutral-300 truncate text-[11px]">
                Masuk: <strong className="text-white">{user.displayName || user.email}</strong>
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium shrink-0">Siap Vote</span>
          </div>
        )}

        {/* Form Usulkan Fitur & Vote (Requires Login) */}
        <AnimatePresence>
          {showSuggestForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateVote}
              className="py-3.5 px-3.5 sm:px-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-1 border-b border-white/5">
                <div className="flex items-center gap-2 text-xs text-neutral-300 min-w-0">
                  <span className="font-semibold text-white truncate">Publikasikan Usulan Vote</span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-neutral-400 text-[11px] truncate">{user?.displayName || user?.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSuggestForm(false)}
                  className="p-1 text-neutral-500 hover:text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Judul fitur baru (contoh: Equalizer Preset Rock & Bass)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  maxLength={120}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[var(--theme-accent)]"
                />
                <textarea
                  placeholder="Detail penjelasan usulan atau kenapa fitur ini Anda butuhkan (opsional)..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  maxLength={350}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[var(--theme-accent)] resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1 gap-2">
                <span className="text-[10px] sm:text-[11px] text-neutral-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>Waktu otomatis tercatat</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSuggestForm(false)}
                    className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingVote || !newTitle.trim()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--theme-accent)] text-white text-xs font-bold shadow-md shadow-[var(--theme-glow)] hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isSubmittingVote ? 'Mengirim...' : 'Kirim Vote'}</span>
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Flat Realtime Community Vote List */}
        {isLoadingVotes ? (
          <div className="py-12 text-center text-xs text-neutral-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-neutral-400" />
            <span>Menghubungkan ke vote komunitas real-time...</span>
          </div>
        ) : votesList.length === 0 ? (
          <div className="py-10 text-center text-xs text-neutral-500">
            Belum ada usulan vote. Jadilah yang pertama memberikan ide!
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {votesList.map((item) => {
              const hasVoted = Boolean(user && Array.isArray(item.voters) && item.voters.includes(user.uid));
              const isRepliesOpen = activeReplyId === item.id;
              const repliesCount = Array.isArray(item.replies) ? item.replies.length : 0;

              return (
                <div key={item.id} className="py-3.5 sm:py-4 space-y-2.5">
                  {/* Topic Header & Vote Row */}
                  <div className="flex items-start justify-between gap-2.5 sm:gap-3 text-left">
                    <div className="space-y-1 flex-1 min-w-0">
                      {/* Title & Status */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-semibold text-neutral-100 leading-snug break-words">
                          {item.title}
                        </h3>
                        <span className={`text-[9px] sm:text-[10px] px-2 py-0.2 rounded-full font-medium shrink-0 ${
                          item.status === 'Selesai'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : item.status === 'Dalam Proses'
                            ? 'bg-blue-500/15 text-blue-400'
                            : 'bg-white/10 text-neutral-400'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      {/* Description if any */}
                      {item.description && (
                        <p className="text-xs text-neutral-400 leading-relaxed break-words">
                          {item.description}
                        </p>
                      )}

                      {/* Author & Timestamp Metadata - Responsive Wrapping */}
                      <div className="flex items-center gap-x-2 gap-y-1 text-[11px] text-neutral-500 pt-0.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          {item.authorPhoto ? (
                            <img
                              src={item.authorPhoto}
                              alt={item.authorName}
                              referrerPolicy="no-referrer"
                              className="w-4 h-4 rounded-full object-cover ring-1 ring-white/20 shrink-0"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-neutral-300 shrink-0">
                              {item.authorName?.[0] || 'U'}
                            </div>
                          )}
                          <span className="text-neutral-300 font-medium truncate max-w-[120px] sm:max-w-[140px]">
                            {item.authorName}
                          </span>
                          {(item.authorEmail === 'revan.seleb.ini0@gmail.com' || item.userId === 'admin-vanz' || item.authorName.toLowerCase().includes('admin')) && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] border border-[var(--theme-accent)]/30 shrink-0">
                              Admin
                            </span>
                          )}
                        </div>

                        <span className="text-neutral-600 hidden xs:inline">•</span>
                        <span title={formatExactDate(item.createdAt)} className="shrink-0">
                          {formatRelativeDate(item.createdAt)}
                        </span>

                        <span className="text-neutral-600 hidden xs:inline">•</span>
                        {/* Toggle Replies button */}
                        <button
                          onClick={() => setActiveReplyId(isRepliesOpen ? null : item.id)}
                          className="text-neutral-400 hover:text-white flex items-center gap-1 transition-colors shrink-0"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{repliesCount > 0 ? `${repliesCount} Komentar` : 'Tulis Komentar'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Upvote Button Pill - Touch Friendly */}
                    <button
                      onClick={() => handleToggleVote(item.id)}
                      title={hasVoted ? 'Batalkan vote' : 'Beri vote'}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                        hasVoted
                          ? 'bg-[var(--theme-accent)] text-white shadow-sm shadow-[var(--theme-glow)]'
                          : 'bg-white/[0.06] text-neutral-300 hover:bg-white/[0.12]'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
                      <span className="font-mono font-bold">{item.votes}</span>
                    </button>
                  </div>

                  {/* THREAD REPLIES ACCORDION */}
                  <AnimatePresence>
                    {isRepliesOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-2.5 sm:pl-4 border-l-2 border-white/[0.08] space-y-3 pt-2 overflow-hidden"
                      >
                        {/* Replies List */}
                        {repliesCount > 0 ? (
                          <div className="space-y-2.5">
                            {item.replies.map((reply) => {
                              const isAdmin = reply.authorEmail === 'revan.seleb.ini0@gmail.com' || reply.userId === 'admin-vanz' || reply.authorName.toLowerCase().includes('admin');
                              return (
                                <div key={reply.id} className="text-xs space-y-1 text-left">
                                  <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] flex-wrap">
                                    {reply.authorPhoto ? (
                                      <img
                                        src={reply.authorPhoto}
                                        alt={reply.authorName}
                                        referrerPolicy="no-referrer"
                                        className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                                      />
                                    ) : (
                                      <div className="w-3.5 h-3.5 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-neutral-300 shrink-0">
                                        {reply.authorName?.[0] || 'U'}
                                      </div>
                                    )}
                                    <span className="font-semibold text-neutral-200 truncate max-w-[120px]">
                                      {reply.authorName}
                                    </span>
                                    {isAdmin && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] border border-[var(--theme-accent)]/30 shrink-0">
                                        Admin
                                      </span>
                                    )}
                                    <span className="text-neutral-600">•</span>
                                    <span title={formatExactDate(reply.createdAt)} className="text-neutral-500 shrink-0">
                                      {formatRelativeDate(reply.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-neutral-300 pl-5 leading-relaxed text-xs sm:text-[13px] break-words">
                                    {reply.content}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[11px] text-neutral-500 py-1">
                            Belum ada komentar dari pengguna lain. Kirim tanggapan Anda di bawah:
                          </div>
                        )}

                        {/* Reply Input Form */}
                        {user ? (
                          <div className="flex items-center gap-2 pt-1">
                            <CornerDownRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <input
                              type="text"
                              placeholder={`Tulis balasan...`}
                              value={replyTextMap[item.id] || ''}
                              onChange={(e) =>
                                setReplyTextMap((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendReply(item.id);
                                }
                              }}
                              className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[var(--theme-accent)] min-w-0"
                            />
                            <button
                              onClick={() => handleSendReply(item.id)}
                              disabled={submittingReplyId === item.id || !(replyTextMap[item.id] || '').trim()}
                              className="px-3 py-2 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-opacity shrink-0 active:scale-95"
                            >
                              <Send className="w-3 h-3" />
                              <span className="hidden sm:inline">{submittingReplyId === item.id ? 'Mengirim...' : 'Kirim'}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 py-2 px-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-neutral-400">
                            <span>Ingin membalas komentar ini?</span>
                            <button
                              onClick={() => triggerLoginNotice('untuk membalas komentar')}
                              className="text-[var(--theme-accent)] hover:underline font-semibold flex items-center gap-1 self-start xs:self-auto"
                            >
                              <LogIn className="w-3 h-3" />
                              <span>Masuk dengan Google</span>
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* LOGIN MODAL / PROMPT DIALOG */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[92vw] sm:max-w-sm rounded-2xl sm:rounded-3xl bg-[#18181b] border border-white/15 p-5 sm:p-6 space-y-4 sm:space-y-5 text-center shadow-2xl relative"
            >
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/10 mx-auto flex items-center justify-center">
                <LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--theme-accent)]" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white">Login Diperlukan</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Silakan masuk menggunakan Akun Google Anda {loginPromptReason}. Nama akun dan foto profil Anda akan otomatis dicantumkan pada vote.
                </p>
              </div>

              <div className="space-y-2 pt-1 sm:pt-2">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isAuthLoading}
                  className="w-full py-3 px-4 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 min-h-[44px]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isAuthLoading ? 'Memproses Login...' : 'Masuk dengan Akun Google'}</span>
                </button>

                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Nanti Saja
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
