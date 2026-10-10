import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { Playlist, Track } from '../../types';
import { DEFAULT_SPOTIFY_TRACKS } from '../../lib/spotify';
import { 
  Heart, 
  ListMusic, 
  Clock, 
  Plus, 
  Play, 
  Trash2, 
  Shuffle, 
  FolderHeart, 
  Database, 
  User as UserIcon,
  Sparkles,
  ArrowLeft,
  Music,
  CheckCircle2,
  ExternalLink,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LibraryViewProps {
  onCreatePlaylistClick: () => void;
  onOpenPlaylistModal: (track: Track) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ 
  onCreatePlaylistClick,
  onOpenPlaylistModal
}) => {
  const { 
    favorites, 
    playlists, 
    history, 
    playTrack, 
    toggleFavoriteAction, 
    removeSongFromPlaylistAction, 
    deletePlaylistAction,
    user,
    signInWithGoogleAction,
    createPlaylist,
    addSongToPlaylistAction,
    spotifyUser,
    loginWithSpotifyAction,
    logoutSpotifyAction
  } = usePlayer();

  const [activeSubTab, setActiveSubTab] = useState<'favorites' | 'history'>('favorites');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  
  // Spotify Login Modal state
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [spotifyNameInput, setSpotifyNameInput] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handlePlayAll = (tracks: Track[], shuffle = false) => {
    if (tracks.length === 0) return;
    let list = [...tracks];
    if (shuffle) {
      list = list.sort(() => Math.random() - 0.5);
    }
    playTrack(list[0], list);
  };

  const handleSpotifyLoginSubmit = async () => {
    setIsImporting(true);
    setImportStatus(null);
    try {
      await loginWithSpotifyAction(spotifyNameInput);
      setImportStatus('Berhasil login & menyinkronkan playlist Spotify akun Anda!');
      setTimeout(() => {
        setIsImporting(false);
        setIsSpotifyModalOpen(false);
        setImportStatus(null);
        setSpotifyNameInput('');
      }, 800);
    } catch (err: any) {
      setImportStatus('Gagal terhubung ke akun Spotify.');
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-300">
      {/* Header & Spotify Login Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">
            Perpustakaan Saya
          </h1>
          <div className="flex items-center gap-3">
            {!spotifyUser ? (
              <button
                onClick={async () => {
                  const clientId = 'f5f7be5ca6a844b18c1e2d171b0814fb';
                  const redirectUri = window.location.origin.includes('vercel.app') ? window.location.origin : (window.location.origin.includes('run.app') || window.location.origin.includes('localhost') ? 'https://vanzmusicid.vercel.app' : window.location.origin);
                  const scopes = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative';

                  const generateRandomString = (length: number) => {
                    let text = '';
                    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                    for (let i = 0; i < length; i++) {
                      text += possible.charAt(Math.floor(Math.random() * possible.length));
                    }
                    return text;
                  };

                  const generateCodeChallenge = async (codeVerifier: string) => {
                    const encoder = new TextEncoder();
                    const data = encoder.encode(codeVerifier);
                    const digest = await window.crypto.subtle.digest('SHA-256', data);
                    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
                      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                  };

                  const codeVerifier = generateRandomString(64);
                  const codeChallenge = await generateCodeChallenge(codeVerifier);
                  window.localStorage.setItem('code_verifier', codeVerifier);
                  window.localStorage.setItem('spotify_redirect_uri', redirectUri);

                  const params = new URLSearchParams({
                    client_id: clientId,
                    response_type: 'code',
                    redirect_uri: redirectUri,
                    scope: scopes,
                    code_challenge_method: 'S256',
                    code_challenge: codeChallenge,
                    show_dialog: 'true'
                  });

                  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#1DB954] hover:bg-[#1aa34a] text-black shadow-lg shadow-[#1DB954]/30 transition-all active:scale-95 cursor-pointer"
              >
                <Music className="w-4 h-4 fill-current" />
                <span>Login dengan Akun Spotify</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#1DB954]/10 border border-[#1DB954]/30">
                <img 
                  src={spotifyUser.images?.[0]?.url || 'https://i.scdn.co/image/ab6761610000e5eb203050d0cabe72e57c99ce44'} 
                  alt={spotifyUser.display_name} 
                  className="w-7 h-7 rounded-full object-cover"
                />
                <div className="text-left">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    {spotifyUser.display_name}
                  </p>
                  <p className="text-[10px] text-[#1DB954] font-semibold">Spotify Terhubung</p>
                </div>
                <button
                  onClick={logoutSpotifyAction}
                  className="ml-2 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-neutral-500 hover:text-rose-500 transition-colors"
                  title="Keluar Spotify"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {!user ? (
          <button
            onClick={signInWithGoogleAction}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold bg-black/5 dark:bg-white/10 hover:bg-[#fa2d48] hover:text-white text-neutral-800 dark:text-neutral-200 border border-black/10 dark:border-white/10 transition-all self-start sm:self-auto cursor-pointer"
          >
            <UserIcon className="w-4 h-4 text-[#fa2d48]" />
            <span>Masuk Google untuk Sinkronisasi</span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold self-start sm:self-auto">
            <span>Tersambung: {user.displayName || user.email}</span>
          </div>
        )}
      </div>

      {/* Sub tabs: Favorites / History */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-3">
          <button
            onClick={() => setActiveSubTab('favorites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeSubTab === 'favorites'
                ? 'bg-[#fa2d48] text-white shadow-md shadow-[#fa2d48]/25'
                : 'bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Favorit ({favorites.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeSubTab === 'history'
                ? 'bg-[#fa2d48] text-white shadow-md shadow-[#fa2d48]/25'
                : 'bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Riwayat ({history.length})</span>
          </button>
        </div>

        {/* Tab content area */}
        <div>
          {/* Sub Tab: Favorites */}
          {activeSubTab === 'favorites' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    Lagu Favorit
                  </h2>
                  <p className="text-xs text-neutral-400">{favorites.length} lagu ditandai suka</p>
                </div>

                {favorites.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePlayAll(favorites)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#fa2d48] text-white shadow-md shadow-[#fa2d48]/25 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Putar Semua</span>
                    </button>
                    <button
                      onClick={() => handlePlayAll(favorites, true)}
                      className="p-2 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-black/10"
                      title="Acak"
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {favorites.length > 0 ? (
                <div className="space-y-1">
                  {favorites.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track, favorites)}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover shadow-sm shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {track.title}
                          </p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="flex items-center gap-2"
                      >
                        <button
                          onClick={() => toggleFavoriteAction(track)}
                          className="p-2 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Hapus dari Favorit"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>

                        <button
                          onClick={() => onOpenPlaylistModal(track)}
                          className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                          title="Tambah ke Playlist"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <FolderHeart className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Belum ada lagu favorit
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Klik ikon hati (♡) pada lagu manapun untuk menyimpannya di sini.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sub Tab: History */}
          {activeSubTab === 'history' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Riwayat Pemutaran Terakhir
                </h2>
                <p className="text-xs text-neutral-400">Tersimpan otomatis di IndexedDB browser Anda</p>
              </div>

              {history.length > 0 ? (
                <div className="space-y-1">
                  {history.map((track, idx) => (
                    <div
                      key={`hist-${track.id}-${idx}`}
                      onClick={() => playTrack(track, history)}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover shadow-sm shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {track.title}
                          </p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="flex items-center gap-2"
                      >
                        <button
                          onClick={() => onOpenPlaylistModal(track)}
                          className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                          title="Tambah ke Playlist"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <Clock className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Belum ada riwayat musik
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Spotify Login Modal */}
      <AnimatePresence>
        {isSpotifyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-3xl bg-neutral-900 border border-white/20 text-white space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#1DB954] text-black flex items-center justify-center font-bold">
                    <Music className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Login dengan Akun Spotify</h3>
                    <p className="text-xs text-neutral-400">Sinkronkan playlist asli akun Spotify Anda</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSpotifyModalOpen(false)}
                  className="text-xs text-neutral-400 hover:text-white p-1.5"
                >
                  ✕
                </button>
              </div>

              {importStatus && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300">Nama Akun / Akses Token Spotify</label>
                <input
                  type="text"
                  value={spotifyNameInput}
                  onChange={(e) => setSpotifyNameInput(e.target.value)}
                  placeholder="Masukkan nama akun Spotify Anda (cth: Revan Spotify)"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[#1DB954]"
                />
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <p className="text-xs font-bold text-neutral-200">Sinkronisasi Otomatis:</p>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Setelah login, seluruh playlist dan lagu favorit dari akun Spotify Anda akan otomatis muncul di tab "Playlist Kamu" dan siap diputar seketika.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsSpotifyModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSpotifyLoginSubmit}
                  disabled={isImporting}
                  className="flex-1 py-2.5 rounded-xl bg-[#1DB954] hover:bg-[#1aa34a] text-black text-xs font-extrabold shadow-lg shadow-[#1DB954]/30 transition-all disabled:opacity-50"
                >
                  {isImporting ? 'Menghubungkan...' : 'Hubungkan & Masuk'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
