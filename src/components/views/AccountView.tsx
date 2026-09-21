import React, { useState, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { 
  LogOut, 
  CheckCircle2, 
  Headphones, 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  MessageSquare,
  Sparkles,
  Camera,
  Edit3,
  Key,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Music,
  Heart,
  History,
  ShieldCheck,
  Image as ImageIcon,
  Upload,
  AlertCircle,
  User as UserIcon,
  Crown,
  Zap,
  Flame,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatAuthError } from '../../lib/firebase';
import { AdminLikeBoosterModal } from '../AdminLikeBoosterModal';
import { AdminVerifiedBadge } from '../AdminVerifiedBadge';
import { ADMIN_EMAIL } from '../../lib/songLikeService';

const PRESET_AVATARS = [
  { id: 'vanz-official', label: 'Vanz Logo', url: 'https://cdn.phototourl.com/free/2026-09-19-571b25e0-aa49-47c1-9fa7-8f7127a2a4cd.png' },
  { id: 'music-1', label: 'Neon Cyber', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80' },
  { id: 'music-2', label: 'Vibe Beats', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80' },
  { id: 'music-3', label: 'Aesthetic Chill', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80' },
  { id: 'music-4', label: 'Synth Headphone', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80' },
  { id: 'music-5', label: 'Sound Studio', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80' },
  { id: 'music-6', label: 'Retro Wave', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80' },
];

export const AccountView: React.FC = () => {
  const { 
    user, 
    isAdmin,
    currentTrack,
    isAuthLoading, 
    signInWithGoogleAction, 
    registerWithEmailAction,
    loginWithEmailAction,
    updateUserProfileAction,
    signInWithGuestProfile,
    signOutAction,
    favorites,
    playlists,
    history
  } = usePlayer();

  // Auth Mode: 'login' | 'register' | 'guest'
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'guest'>('login');
  
  // Auth Form Fields
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(PRESET_AVATARS[0].url);
  const [showPassword, setShowPassword] = useState(false);
  
  // States
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Profile Modal / Form
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editPhotoUrl, setEditPhotoUrl] = useState(user?.photoURL || '');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Admin Booster Modal
  const [isAdminBoosterOpen, setIsAdminBoosterOpen] = useState(false);

  // File Upload Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const registerFileInputRef = useRef<HTMLInputElement>(null);
  const guestFileInputRef = useRef<HTMLInputElement>(null);

  // Copy Email state
  const [copied, setCopied] = useState(false);
  const supportEmail = 'support.vanzmusicid@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getGmailComposeUrl = (subject = 'Bantuan Vanz Music') => {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(supportEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent('Halo Tim Support Vanz Music,\n\nSaya ingin menyampaikan:\n')}`;
  };

  const getMailtoUrl = (subject = 'Bantuan Vanz Music') => {
    return `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('Halo Tim Support Vanz Music,\n\nSaya ingin menyampaikan:\n')}`;
  };

  // Helper to process and compress images from device/gallery
  const processImageFile = (file: File, onSuccess: (dataUrl: string) => void) => {
    if (!file.type.startsWith('image/')) {
      setAuthError('Harap pilih file gambar (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onSuccess(dataUrl);
        } else {
          onSuccess(e.target?.result as string);
        }
      };
      img.onerror = () => {
        setAuthError('Gagal memproses file foto dari galeri.');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // ---------------- Handlers for Auth ----------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setAuthError('Harap isi email dan kata sandi.');
      return;
    }
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await loginWithEmailAction(emailInput, passwordInput);
      setAuthSuccess('Berhasil masuk ke akun Anda!');
      setTimeout(() => setAuthSuccess(null), 3000);
    } catch (err: any) {
      setAuthError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput || !nameInput) {
      setAuthError('Harap lengkapi nama, email, dan kata sandi.');
      return;
    }
    if (passwordInput.length < 6) {
      setAuthError('Kata sandi harus minimal 6 karakter.');
      return;
    }
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await registerWithEmailAction(emailInput, passwordInput, nameInput, selectedAvatarUrl);
      setAuthSuccess('Akun berhasil dibuat dan siap digunakan!');
      setTimeout(() => setAuthSuccess(null), 3000);
    } catch (err: any) {
      setAuthError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setAuthError('Masukkan nama panggilan Anda.');
      return;
    }
    signInWithGuestProfile(nameInput, selectedAvatarUrl);
    setAuthSuccess('Masuk sebagai Tamu berhasil!');
    setTimeout(() => setAuthSuccess(null), 3000);
  };

  // ---------------- Handlers for Profile Update ----------------
  const handleOpenEditProfile = () => {
    setEditName(user?.displayName || '');
    setEditPhotoUrl(user?.photoURL || '');
    setCustomUrlInput('');
    setProfileSuccessMsg(null);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setAuthError('Nama tampilan tidak boleh kosong.');
      return;
    }
    setIsUpdatingProfile(true);
    setAuthError(null);
    try {
      await updateUserProfileAction({
        displayName: editName.trim(),
        photoURL: editPhotoUrl || undefined
      });
      setProfileSuccessMsg('Profil dan foto berhasil diperbarui!');
      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setAuthError(err?.message || 'Gagal memperbarui profil.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file, (dataUrl) => {
      setEditPhotoUrl(dataUrl);
      setSelectedAvatarUrl(dataUrl);
    });
  };

  const handleRegisterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file, (dataUrl) => {
      setSelectedAvatarUrl(dataUrl);
    });
  };

  const handleGuestFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file, (dataUrl) => {
      setSelectedAvatarUrl(dataUrl);
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="max-w-xl mx-auto px-4 py-6 sm:py-8 space-y-7 pb-36 text-white"
    >
      {/* Header Halaman */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Akun & Profil</h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Vanz Music (Beta) • Riwayat, playlist, dan identitas musik Anda
        </p>
      </div>

      <div className="h-[1px] bg-white/10 w-full" />

      {/* JIKA SUDAH LOGIN / AKTIF */}
      {user ? (
        <section className="space-y-6">
          {/* Kartu Profil Aktif */}
          <div className="relative p-5 sm:p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="relative group">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[var(--theme-accent)] shadow-md shadow-[var(--theme-glow)]"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[var(--theme-accent)] flex items-center justify-center text-white text-xl font-bold shadow-md shadow-[var(--theme-glow)]">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </div>
                  )}

                  <button
                    onClick={handleOpenEditProfile}
                    title="Ganti Foto Profil"
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-black/80 border border-white/20 text-white hover:bg-[var(--theme-accent)] transition-all shadow-md"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-white truncate">
                      {user.displayName || 'Pengguna Vanz'}
                    </h3>
                    {isAdmin ? (
                      <AdminVerifiedBadge className="w-4 h-4 text-white shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[var(--theme-accent)] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 truncate">
                    {user.email || 'Akun Tamu Lokal'}
                  </p>
                  
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 mt-1">
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      Hak Akses Admin Penuh Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mt-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Data Terisolasi & Tersimpan
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleOpenEditProfile}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Profil</span>
              </button>
            </div>

            {/* Statistik Akun yang Terisolasi */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
              <div className="p-2 rounded-xl bg-white/[0.02]">
                <div className="flex items-center justify-center gap-1 text-[var(--theme-accent)] mb-0.5">
                  <Music className="w-3.5 h-3.5" />
                  <span className="text-sm sm:text-base font-bold text-white">{playlists.length}</span>
                </div>
                <p className="text-[10px] text-neutral-400">Playlist Akun</p>
              </div>

              <div className="p-2 rounded-xl bg-white/[0.02]">
                <div className="flex items-center justify-center gap-1 text-rose-400 mb-0.5">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span className="text-sm sm:text-base font-bold text-white">{favorites.length}</span>
                </div>
                <p className="text-[10px] text-neutral-400">Lagu Disukai</p>
              </div>

              <div className="p-2 rounded-xl bg-white/[0.02]">
                <div className="flex items-center justify-center gap-1 text-sky-400 mb-0.5">
                  <History className="w-3.5 h-3.5" />
                  <span className="text-sm sm:text-base font-bold text-white">{history.length}</span>
                </div>
                <p className="text-[10px] text-neutral-400">Riwayat Putar</p>
              </div>
            </div>

            {/* PUSAT KENDALI ADMIN (KHUSUS EMAIL ADMIN RESMI) */}
            {isAdmin && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
                      <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white tracking-wide uppercase">
                        Pusat Kendali Admin & Booster Like
                      </h4>
                      <p className="text-[10px] text-amber-300/80">
                        Khusus akun {ADMIN_EMAIL} (User lain tidak memiliki akses)
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAdminBoosterOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Pusat Booster Admin</span>
                  </button>
                </div>

                <p className="text-xs text-neutral-300">
                  Sebagai admin resmi ({ADMIN_EMAIL}), Anda memiliki kendali penuh untuk melakukan booster like lagu, booster voting usulan komunitas, dan booster like komentar sesuka hati.
                </p>

                {currentTrack && (
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={currentTrack.thumbnail}
                        alt={currentTrack.title}
                        className="w-8 h-8 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
                        <p className="text-[10px] text-neutral-400 truncate">{currentTrack.artist}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAdminBoosterOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-amber-300 shrink-0"
                    >
                      + Boost Lagu Ini
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tombol Logout */}
            <div className="pt-1 flex items-center justify-between">
              <p className="text-[11px] text-neutral-400">
                Pindah akun untuk memuat playlist & riwayat yang berbeda.
              </p>
              <button
                onClick={signOutAction}
                disabled={isAuthLoading}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all text-rose-400 text-xs font-semibold border border-rose-500/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>

          {/* Modal / Dialog Edit Profil */}
          <AnimatePresence>
            {isEditingProfile && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="p-5 rounded-2xl bg-neutral-900 border border-white/20 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[var(--theme-accent)]" />
                    <h3 className="text-sm font-bold text-white">Sesuaikan Nama & Foto Profil</h3>
                  </div>
                  <button 
                    onClick={() => setIsEditingProfile(false)}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Batal
                  </button>
                </div>

                {profileSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {/* Ganti Nama */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Nama Tampilan (Custom Name)</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Masukkan nama tampilan Anda"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[var(--theme-accent)]"
                  />
                </div>

                {/* Pilih Foto Profil */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-300">Pilih Avatar / Upload Foto</label>
                  
                  {/* Preset Avatars */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setEditPhotoUrl(av.url)}
                        className={`relative shrink-0 w-11 h-11 rounded-full overflow-hidden border-2 transition-all ${
                          editPhotoUrl === av.url ? 'border-[var(--theme-accent)] scale-105 ring-2 ring-[var(--theme-glow)]' : 'border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  {/* Upload / URL Options */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                      <span>Upload dari Galeri / File</span>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  {/* Input Direct Image URL */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="url"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="Atau tempel Link URL gambar..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[var(--theme-accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customUrlInput.trim()) {
                          setEditPhotoUrl(customUrlInput.trim());
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>

                {/* Preview Avatar Saat Ini */}
                {editPhotoUrl && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <img 
                      src={editPhotoUrl} 
                      alt="Preview" 
                      className="w-10 h-10 rounded-full object-cover border border-white/20" 
                    />
                    <div className="text-[11px] text-neutral-400">
                      Foto profil terpilih akan langsung aktif di pemutar lagu, vote komunitas, dan komentar.
                    </div>
                  </div>
                )}

                {/* Tombol Simpan */}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isUpdatingProfile}
                    className="px-4 py-2 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 text-white text-xs font-bold shadow-md shadow-[var(--theme-glow)] transition-all disabled:opacity-50"
                  >
                    {isUpdatingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      ) : (
        /* JIKA BELUM LOGIN: FORM LOGIN / REGISTER / GUEST */
        <section className="space-y-5">
          {/* Tab Switcher: Masuk vs Daftar vs Tamu */}
          <div className="flex p-1 rounded-xl bg-white/[0.06] border border-white/10">
            <button
              onClick={() => { setAuthTab('login'); setAuthError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                authTab === 'login' ? 'bg-[var(--theme-accent)] text-white shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>

            <button
              onClick={() => { setAuthTab('register'); setAuthError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                authTab === 'register' ? 'bg-[var(--theme-accent)] text-white shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Akun</span>
            </button>

            <button
              onClick={() => { setAuthTab('guest'); setAuthError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                authTab === 'guest' ? 'bg-[var(--theme-accent)] text-white shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Mode Tamu</span>
            </button>
          </div>

          {/* Feedback & Error Alerts */}
          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* FORM LOGIN */}
          {authTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white">Masuk ke Akun Anda</h2>
                <p className="text-[11px] text-neutral-400">
                  Setiap akun memiliki riwayat putar musik dan daftar playlist sendiri.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Alamat Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[var(--theme-accent)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Kata Sandi</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[var(--theme-accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-[var(--theme-glow)] transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Memproses...' : 'Masuk Sekarang'}
              </button>

              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative px-2 bg-[#141416] text-[10px] text-neutral-400 uppercase">
                  Atau Masuk Cepat
                </span>
              </div>

              <button
                type="button"
                onClick={signInWithGoogleAction}
                disabled={isAuthLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 active:scale-[0.99] transition-all text-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.23 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.5-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.99 0 12s.43 3.9 1.19 5.42l4.09-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Masuk dengan Akun Google</span>
              </button>
            </form>
          )}

          {/* FORM DAFTAR AKUN BARU */}
          {authTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white">Daftar Akun Vanz Music Baru</h2>
                <p className="text-[11px] text-neutral-400">
                  Dapatkan ruang penyimpanan playlist dan riwayat lagu pribadi Anda.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Nama Tampilan (Custom Name)</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Contoh: Revan Vanz"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[var(--theme-accent)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Alamat Email</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[var(--theme-accent)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Kata Sandi</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[var(--theme-accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Pilihan Foto Profil Saat Mendaftar: Dari Galeri HP / Perangkat */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-300">Foto Profil Akun</label>
                  <span className="text-[11px] text-neutral-400">Dari Galeri HP / Perangkat</span>
                </div>

                {/* Preview Avatar yang Dipilih */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                  <img 
                    src={selectedAvatarUrl} 
                    alt="Preview Avatar" 
                    className="w-12 h-12 rounded-full object-cover border-2 border-[var(--theme-accent)] shrink-0 shadow-md shadow-[var(--theme-glow)]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {selectedAvatarUrl.startsWith('data:image') 
                        ? 'Foto dari Galeri Perangkat' 
                        : 'Foto Profil Standar'}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      Pilih foto profil dari galeri HP atau file Anda.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => registerFileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-[var(--theme-glow)]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Galeri HP</span>
                  </button>
                  <input 
                    type="file" 
                    ref={registerFileInputRef} 
                    onChange={handleRegisterFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-[var(--theme-glow)] transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Membuat Akun...' : 'Daftar Akun Sekarang'}
              </button>
            </form>
          )}

          {/* FORM MODE TAMU */}
          {authTab === 'guest' && (
            <form onSubmit={handleGuestLoginSubmit} className="space-y-3.5 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white">Gunakan Profil Tamu Cepat</h2>
                <p className="text-[11px] text-neutral-400">
                  Tanpa perlu password. Data disimpan secara offline di perangkat ini.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Nama Panggilan Anda</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Contoh: Pendengar Musik"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[var(--theme-accent)]"
                />
              </div>

              {/* Pilihan Foto Profil Mode Tamu: Dari Galeri HP / Perangkat */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-300">Foto Profil Tamu</label>
                  <span className="text-[11px] text-neutral-400">Dari Galeri HP / Perangkat</span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                  <img 
                    src={selectedAvatarUrl} 
                    alt="Preview Avatar Tamu" 
                    className="w-12 h-12 rounded-full object-cover border-2 border-[var(--theme-accent)] shrink-0 shadow-md shadow-[var(--theme-glow)]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {selectedAvatarUrl.startsWith('data:image') 
                        ? 'Foto dari Galeri Perangkat' 
                        : 'Foto Profil Standar'}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      Pilih foto dari galeri HP untuk profil tamu.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => guestFileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-[var(--theme-glow)]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Galeri HP</span>
                  </button>
                  <input 
                    type="file" 
                    ref={guestFileInputRef} 
                    onChange={handleGuestFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.99] text-white text-xs font-bold transition-all"
              >
                Mulai sebagai Tamu
              </button>
            </form>
          )}
        </section>
      )}

      <div className="h-[1px] bg-white/10 w-full" />

      {/* Customer Service & Bantuan */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-[var(--theme-accent)]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Customer Service & Bantuan
            </h2>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>

        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
          Ada kendala, lapor bug lagu, atau ingin request lagu baru? Hubungi tim support Vanz Music langsung via email resmi.
        </p>

        {/* Email bar */}
        <div className="flex items-center justify-between gap-2 py-2 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
            <span className="text-xs sm:text-sm font-mono text-white select-all truncate">
              {supportEmail}
            </span>
          </div>

          <button
            onClick={handleCopyEmail}
            className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white py-1 px-2.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            title="Salin Alamat Email"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>

        {/* Tombol aksi langsung */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          <a
            href={getGmailComposeUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-2 px-3.5 rounded-xl bg-[#fa2d48] hover:bg-[#e0263f] text-white font-semibold text-xs transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Kirim via Gmail</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          <a
            href={getMailtoUrl()}
            className="inline-flex items-center gap-2 py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-neutral-300" />
            <span>Buka Aplikasi Email</span>
          </a>
        </div>

        {/* Topik Bantuan */}
        <div className="pt-2 space-y-2">
          <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[var(--theme-accent)]" />
            Topik Bantuan Populer:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Lapor Bug / Error Lagu',
              'Permintaan Lagu Baru',
              'Masalah Login Akun',
              'Ganti Foto Profil & Nama',
              'Saran & Masukan'
            ].map((topic) => (
              <a
                key={topic}
                href={getGmailComposeUrl(topic)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
              >
                {topic}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Modal Admin Booster Like (Hanya untuk Admin) */}
      {isAdmin && (
        <AdminLikeBoosterModal
          isOpen={isAdminBoosterOpen}
          onClose={() => setIsAdminBoosterOpen(false)}
          initialTrack={currentTrack}
        />
      )}
    </motion.div>
  );
};
