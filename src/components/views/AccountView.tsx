import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

export const AccountView: React.FC = () => {
  const { user, isAuthLoading, signInWithGoogleAction, signOutAction } = usePlayer();
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="max-w-xl mx-auto px-4 py-8 space-y-8 pb-36 text-white"
    >
      {/* Header Halaman */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Akun</h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Vanz Music (Beta Testing) • Kelola akun dan dapatkan bantuan
        </p>
      </div>

      <div className="h-[1px] bg-white/10 w-full" />

      {/* Profil Pengguna Biasa Tanpa Card */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Profil Pengguna
        </h2>

        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[var(--theme-accent)] flex items-center justify-center text-white text-base font-bold">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-semibold text-white truncate">{user.displayName || 'Pengguna'}</h3>
                  <CheckCircle2 className="w-4 h-4 text-[var(--theme-accent)] shrink-0" />
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 truncate">{user.email}</p>
              </div>
            </div>

            <div>
              <button
                onClick={signOutAction}
                disabled={isAuthLoading}
                className="inline-flex items-center gap-2 py-2 px-3.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-colors text-rose-400 text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Masuk dengan akun Google untuk menyinkronkan lagu favorit dan playlist Anda di semua perangkat.
            </p>

            <button
              onClick={signInWithGoogleAction}
              disabled={isAuthLoading}
              className="inline-flex items-center gap-2.5 py-2.5 px-4 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 active:scale-[0.98] transition-all text-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.23 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.5-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.99 0 12s.43 3.9 1.19 5.42l4.09-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Masuk dengan Google</span>
            </button>
          </div>
        )}
      </section>

      <div className="h-[1px] bg-white/10 w-full" />

      {/* Customer Service Biasa Tanpa Card */}
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
          Ada kendala, lapor bug, atau ingin request lagu? Hubungi tim support Vanz Music langsung via email resmi.
        </p>

        {/* Email bar sederhana */}
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
            Topik Bantuan:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Lapor Bug / Error Lagu',
              'Permintaan Lagu Baru',
              'Masalah Login Google',
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
    </motion.div>
  );
};
