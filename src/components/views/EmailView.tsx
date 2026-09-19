import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { 
  Mail, 
  Send, 
  PlusCircle, 
  Image as ImageIcon, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  X, 
  Upload, 
  Link as LinkIcon, 
  Megaphone,
  Layers,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminMessage } from '../../types';
import { 
  fetchAdminMessages, 
  postAdminMessage, 
  deleteAdminMessage, 
  isUserAdmin 
} from '../../lib/messageService';

type TagType = 'Semua' | 'Update' | 'Fitur Baru' | 'Musik' | 'Pengumuman' | 'Penting';

export const EmailView: React.FC = () => {
  const { user } = usePlayer();
  const isAdmin = isUserAdmin(user?.email);

  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TagType>('Semua');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState<AdminMessage['tag']>('Update');
  const [imageUrl, setImageUrl] = useState('');
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [isPosting, setIsPosting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminMessages();
      setMessages(data);
    } catch (e) {
      console.error('Failed to load messages:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // Handle local image file upload & conversion to base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 3MB for base64 storage)
    if (file.size > 3 * 1024 * 1024) {
      setErrorNotice('Ukuran file terlalu besar. Maksimal ukuran gambar adalah 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageUrl(result);
        setErrorNotice(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorNotice('Judul dan isi pesan tidak boleh kosong.');
      return;
    }

    setIsPosting(true);
    setErrorNotice(null);

    try {
      const newMsg = await postAdminMessage({
        title: title.trim(),
        content: content.trim(),
        tag: tag || 'Update',
        imageUrl: imageUrl.trim() || undefined,
        authorName: user?.displayName || 'Admin',
        authorEmail: user?.email || undefined
      });

      setMessages(prev => [newMsg, ...prev.filter(m => m.id !== newMsg.id)]);
      
      // Reset form
      setTitle('');
      setContent('');
      setImageUrl('');
      setTag('Update');
      setIsComposeOpen(false);
      setSuccessNotice('Pesan update berhasil dikirim dan dipublikasikan!');
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: any) {
      setErrorNotice('Gagal mengirim pesan. Silakan coba lagi.');
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Hapus pesan update ini?')) return;
    try {
      await deleteAdminMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (activeFilter === 'Semua') return true;
    return msg.tag === activeFilter;
  });

  const getTagBadge = (msgTag?: string) => {
    switch (msgTag) {
      case 'Fitur Baru':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Musik':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Pengumuman':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Penting':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Update':
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    }
  };

  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'Baru saja';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-36"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30 flex items-center justify-center text-[var(--theme-accent)] shadow-lg shadow-[var(--theme-glow)]">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Email & Update</h1>
              {isAdmin && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Pesan, pembaruan fitur, dan pengumuman resmi dari admin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadMessages}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-all border border-white/5"
            title="Muat Ulang Pesan"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[var(--theme-accent)]' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsComposeOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[var(--theme-glow)] transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Kirim Update Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {successNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 shadow-xl"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-medium">{successNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['Semua', 'Update', 'Fitur Baru', 'Musik', 'Pengumuman', 'Penting'] as TagType[]).map((tabItem) => (
          <button
            key={tabItem}
            onClick={() => setActiveFilter(tabItem)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              activeFilter === tabItem
                ? 'bg-white text-black border-white shadow-md font-semibold'
                : 'bg-white/5 text-neutral-400 border-white/5 hover:text-white hover:bg-white/10'
            }`}
          >
            {tabItem}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      {isLoading && messages.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[var(--theme-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-400">Memuat pesan update...</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white/[0.02] border border-white/5 rounded-3xl p-8">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-500 mx-auto">
            <Megaphone className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">Belum ada pesan dalam kategori ini</p>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Pesan dan pengumuman baru dari admin akan muncul secara otomatis di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((msg) => (
            <article 
              key={msg.id}
              className="group bg-[#1e1e20]/90 hover:bg-[#222226] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all shadow-xl hover:shadow-2xl relative overflow-hidden"
            >
              {/* Top Meta info */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border ${getTagBadge(msg.tag)}`}>
                    {msg.tag || 'Update'}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                    <Clock className="w-3 h-3" />
                    {formatDate(msg.createdAt)}
                  </span>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="opacity-60 hover:opacity-100 p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                    title="Hapus pesan ini (Admin)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-[var(--theme-accent)] transition-colors">
                {msg.title}
              </h2>

              {/* Text Content */}
              <div className="text-neutral-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-normal space-y-2">
                {msg.content}
              </div>

              {/* Attached Image if any */}
              {msg.imageUrl && (
                <div className="mt-4 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 bg-black/40 relative group/img cursor-pointer"
                  onClick={() => setSelectedImage(msg.imageUrl!)}
                >
                  <img 
                    src={msg.imageUrl} 
                    alt={msg.title} 
                    referrerPolicy="no-referrer"
                    className="w-full max-h-80 sm:max-h-96 object-cover hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-white/90 flex items-center gap-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3" />
                    Perbesar Gambar
                  </div>
                </div>
              )}

              {/* Footer Sender */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-accent)]" />
                  <span>Dipublikasikan oleh {msg.authorName || 'Admin'}</span>
                </span>
                <span className="text-[10px] text-neutral-500">VanzMusic Official</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Compose Modal (Admin Only) */}
      <AnimatePresence>
        {isComposeOpen && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#1c1c1e] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-white relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">Kirim Pesan & Update Baru</h3>
                    <p className="text-xs text-neutral-400">Pesan akan diterbitkan ke semua pengguna aplikasi</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsComposeOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorNotice && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {errorNotice}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Judul Update</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Pembaruan v2.5 - Fitur Lirik Sinkron"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[var(--theme-accent)] transition-colors"
                    required
                  />
                </div>

                {/* Category Tag */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Kategori Tag</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {(['Update', 'Fitur Baru', 'Musik', 'Pengumuman', 'Penting'] as const).map((tagOption) => (
                      <button
                        key={tagOption}
                        type="button"
                        onClick={() => setTag(tagOption)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all text-center ${
                          tag === tagOption 
                            ? 'bg-[var(--theme-accent)] text-white border-[var(--theme-accent)] shadow-sm'
                            : 'bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {tagOption}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Isi Pesan / Catatan Pembaruan</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    placeholder="Jelaskan detail pembaruan, lagu rekomendasi baru, atau informasi penting untuk pendengar..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[var(--theme-accent)] transition-colors resize-none leading-relaxed"
                    required
                  />
                </div>

                {/* Image Attachment Section */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                      Lampiran Gambar (Opsional)
                    </label>

                    <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setImageTab('upload')}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          imageTab === 'upload' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Unggah File
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageTab('url')}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          imageTab === 'url' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Tautan URL
                      </button>
                    </div>
                  </div>

                  {imageTab === 'upload' ? (
                    <div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 px-4 rounded-xl border border-dashed border-white/20 hover:border-[var(--theme-accent)] bg-white/[0.03] hover:bg-white/[0.06] text-neutral-300 hover:text-white text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-[var(--theme-accent)]" />
                        <span>Pilih Gambar dari Perangkat / Galeri</span>
                      </button>
                    </div>
                  ) : (
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://contoh-gambar.com/banner.jpg"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[var(--theme-accent)] transition-colors"
                    />
                  )}

                  {/* Image Preview */}
                  {imageUrl && (
                    <div className="relative rounded-xl overflow-hidden border border-white/15 bg-black/40 mt-2">
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-full h-32 object-cover" 
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white text-xs"
                        title="Hapus gambar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsComposeOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPosting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 text-white text-xs font-bold shadow-lg shadow-[var(--theme-glow)] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isPosting ? 'Mengirim...' : 'Publikasikan Pesan'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full-Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <div 
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20"
            >
              <img 
                src={selectedImage} 
                alt="Enlarged" 
                className="w-full h-full object-contain max-h-[85vh]"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
