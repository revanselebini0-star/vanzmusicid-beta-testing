import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { User, LogIn, LogOut, CheckCircle2, ShieldCheck, Music2, Sparkles, Cloud } from 'lucide-react';
import { motion } from 'motion/react';

export const AccountView: React.FC = () => {
  const { user, isAuthLoading, signInWithGoogleAction, signOutAction } = usePlayer();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-8 pb-32"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#fa2d48]/10 flex items-center justify-center text-[#fa2d48]">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Akun Saya</h1>
          <p className="text-sm text-neutral-400">Kelola akun Google dan sinkronisasi perpustakaan musik Anda</p>
        </div>
      </div>

      {/* Auth Card */}
      <div className="apple-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#fa2d48]/5 rounded-full blur-3xl pointer-events-none" />

        {user ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full ring-2 ring-[#fa2d48]/50 object-cover shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#fa2d48] flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white">{user.displayName || 'Pengguna Musik'}</h2>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm text-neutral-400">{user.email}</p>
                <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Cloud className="w-3.5 h-3.5" /> Terhubung & Disinkronkan
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3">
              <button
                onClick={signOutAction}
                disabled={isAuthLoading}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 transition-all font-semibold text-white text-sm"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Keluar (Sign Out)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#fa2d48] to-rose-600 flex items-center justify-center text-white shadow-xl shadow-[#fa2d48]/30 shrink-0">
                <Music2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Masuk dengan Akun Google</h2>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Sinkronkan playlist favorit, riwayat pemutaran, dan koleksi lagu Anda secara otomatis di perangkat apa pun.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Autentikasi aman melalui Google Firebase Auth</span>
              </div>

              <button
                onClick={signInWithGoogleAction}
                disabled={isAuthLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-white text-black font-semibold hover:bg-neutral-200 active:scale-95 transition-all shadow-xl"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.23 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.5-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.99 0 12s.43 3.9 1.19 5.42l4.09-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Masuk dengan Google</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Features Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Sinkronisasi Cloud</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Data playlist dan lagu kesukaan Anda aman tersimpan di cloud Firestore.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Cloud className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Akses Lintas Perangkat</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Putar musik favorit kapan saja di laptop, tablet, maupun ponsel Anda.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
