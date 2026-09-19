import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { User, LogOut, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const AccountView: React.FC = () => {
  const { user, isAuthLoading, signInWithGoogleAction, signOutAction } = usePlayer();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="max-w-xl mx-auto px-4 py-8 space-y-6 pb-32"
    >
      <h1 className="text-2xl font-bold tracking-tight text-white mb-6">Akun</h1>

      {user ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 py-4 border-b border-white/10">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'User'} 
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[var(--theme-accent)] flex items-center justify-center text-white text-lg font-bold">
                {user.displayName?.[0] || user.email?.[0] || 'U'}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-semibold text-white truncate">{user.displayName || 'Pengguna'}</h2>
                <CheckCircle2 className="w-4 h-4 text-[var(--theme-accent)] shrink-0" />
              </div>
              <p className="text-sm text-neutral-400 truncate">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={signOutAction}
              disabled={isAuthLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.99] transition-all text-rose-400 text-sm font-medium border border-white/5"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Masuk ke Akun Google</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Masuk untuk menyinkronkan playlist, lagu favorit, dan riwayat pemutaran musik Anda di semua perangkat.
            </p>
          </div>

          <button
            onClick={signInWithGoogleAction}
            disabled={isAuthLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-white text-black font-medium hover:bg-neutral-200 active:scale-[0.99] transition-all text-sm shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
      )}
    </motion.div>
  );
};
