import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Film, Mic, Disc3, Headphones, Check, Zap } from 'lucide-react';

interface DolbyProfile {
  id: 'spatial' | 'cinema' | 'vocal' | 'bass';
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const DOLBY_PROFILES: DolbyProfile[] = [
  {
    id: 'spatial',
    title: 'Spatial Audio 3D',
    subtitle: 'Panggung Suara 3D Imersif',
    badge: 'Rekomendasi',
    icon: Sparkles,
    description: 'Menghadirkan pemisahan stereo lebar dan tata suara melingkar 360° yang nyaman di telinga.'
  },
  {
    id: 'cinema',
    title: 'Cinema Surround',
    subtitle: 'Dinamika Sinematik Megah',
    badge: 'Theater',
    icon: Film,
    description: 'Sensasi audio ruang teater bioskop dengan kejernihan treble dan gaung spatial yang lapang.'
  },
  {
    id: 'vocal',
    title: 'Vocal & Clarity',
    subtitle: 'Kejernihan Vokal & Akustik',
    badge: 'Acoustic',
    icon: Mic,
    description: 'Fokus pada frekuensi tengah agar suara penyanyi dan petikan instrumen terdengar sangat jelas.'
  },
  {
    id: 'bass',
    title: 'Bass Max Boost',
    subtitle: 'Sub-Bass Hangat & Bulat',
    badge: 'Punchy',
    icon: Disc3,
    description: 'Peningkatan frekuensi rendah sub-bass yang bertenaga tanpa membuat suara vokal mendem.'
  }
];

export const DolbyAtmosModal: React.FC = () => {
  const { 
    isDolbyModalOpen, 
    setDolbyModalOpen, 
    isDolbyAtmos, 
    toggleDolbyAtmos, 
    dolbyMode, 
    setDolbyMode 
  } = usePlayer();

  if (!isDolbyModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setDolbyModalOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg bg-[#141418] border-t sm:border border-white/[0.14] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto"
        >
          {/* Mobile swipe grab handle */}
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 p-[1px] shadow-lg shadow-rose-500/20">
                <div className="w-full h-full bg-neutral-900 rounded-[11px] flex items-center justify-center font-black text-xs tracking-tighter text-white">
                  DA
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-white tracking-wider">
                    DOLBY ATMOS®
                  </h2>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/30">
                    Spatial
                  </span>
                </div>
                <p className="text-xs text-white/50">
                  Spatial Audio 3D & Acoustic Surround Processing
                </p>
              </div>
            </div>

            <button 
              onClick={() => setDolbyModalOpen(false)}
              className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Master Toggle Banner */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-neutral-900/90 to-neutral-800/90 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isDolbyAtmos 
                  ? 'bg-[var(--theme-accent)] text-white shadow-lg shadow-[var(--theme-glow)]' 
                  : 'bg-white/5 text-white/40'
              }`}>
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  Efek Dolby Atmos
                  {isDolbyAtmos && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </p>
                <p className="text-xs text-white/50">
                  {isDolbyAtmos ? 'Aktif untuk semua musik' : 'Efek dinonaktifkan (Stereo standar)'}
                </p>
              </div>
            </div>

            {/* iOS style toggle switch */}
            <button
              onClick={toggleDolbyAtmos}
              className={`w-13 h-7.5 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer flex items-center ${
                isDolbyAtmos ? 'bg-[var(--theme-accent)] shadow-md shadow-[var(--theme-glow)]' : 'bg-white/20'
              }`}
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform ${
                  isDolbyAtmos ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Soundstage Profiles */}
          <div className="mt-5 space-y-2">
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider block px-1">
              Pilih Profil Tata Suara Spatial:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DOLBY_PROFILES.map((profile) => {
                const Icon = profile.icon;
                const isSelected = dolbyMode === profile.id;

                return (
                  <button
                    key={profile.id}
                    disabled={!isDolbyAtmos}
                    onClick={() => setDolbyMode(profile.id)}
                    className={`relative p-3.5 rounded-2xl text-left transition-all border ${
                      !isDolbyAtmos 
                        ? 'opacity-40 border-white/5 bg-white/[0.02] cursor-not-allowed'
                        : isSelected
                          ? 'bg-[var(--theme-accent)]/15 border-[var(--theme-accent)] shadow-md shadow-[var(--theme-glow)] text-white'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${
                          isSelected ? 'bg-[var(--theme-accent)] text-white' : 'bg-white/10 text-white/70'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">
                            {profile.title}
                          </p>
                          <p className="text-[10px] text-white/50">{profile.subtitle}</p>
                        </div>
                      </div>

                      {isSelected && isDolbyAtmos && (
                        <span className="w-5 h-5 rounded-full bg-[var(--theme-accent)] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-white/60 leading-relaxed mt-1">
                      {profile.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Headphone Tip */}
          <div className="mt-5 p-3 rounded-xl bg-white/[0.04] border border-white/5 flex items-center gap-3">
            <Headphones className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-[11px] text-white/70 leading-snug">
              <strong className="text-white">Tip Kenyamanan:</strong> Efek Dolby Atmos Spatial 3D terasa paling maksimal saat mendengarkan menggunakan <strong>earphone atau headset</strong>.
            </p>
          </div>

          {/* Action button */}
          <button
            onClick={() => setDolbyModalOpen(false)}
            className="w-full mt-4 py-3 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.99] text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-[var(--theme-glow)] transition-all"
          >
            Terapkan & Lanjutkan Mendengarkan
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default DolbyAtmosModal;
