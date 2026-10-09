import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Music, 
  Image as ImageIcon, 
  CheckCircle2, 
  Play, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Key, 
  Sliders, 
  ExternalLink,
  Flame,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getCloudinaryConfig, 
  saveCloudinaryConfig, 
  getVanzTeamTracks, 
  saveVanzTeamTrack, 
  deleteVanzTeamTrack,
  uploadTrackKeCloud, 
  gantiNamaFileMusik,
  type CloudinaryConfig 
} from '../lib/vanzTeamMusic';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';

interface VanzCloudStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VanzCloudStudioModal: React.FC<VanzCloudStudioModalProps> = ({ isOpen, onClose }) => {
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const [activeTab, setActiveTab] = useState<'upload' | 'catalog' | 'rename' | 'config'>('upload');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [config, setConfig] = useState<CloudinaryConfig>(getCloudinaryConfig());

  // Upload Form State
  const [judulLagu, setJudulLagu] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioUrlInput, setAudioUrlInput] = useState<string>('');
  const [coverUrlInput, setCoverUrlInput] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  // Rename Tool State
  const [renameType, setRenameType] = useState<'video' | 'image'>('video');
  const [namaLama, setNamaLama] = useState<string>('langkah-akhir');
  const [namaBaru, setNamaBaru] = useState<string>('lagu-final-vanz');
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [renameMessage, setRenameMessage] = useState<string | null>(null);

  // Config Form State
  const [editCloudName, setEditCloudName] = useState<string>(config.CLOUD_NAME);
  const [editApiKey, setEditApiKey] = useState<string>(config.API_KEY);
  const [editApiSecret, setEditApiSecret] = useState<string>(config.API_SECRET);
  const [editPreset, setEditPreset] = useState<string>(config.UPLOAD_PRESET);
  const [configSavedNotice, setConfigSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setTracks(getVanzTeamTracks());
      const curConfig = getCloudinaryConfig();
      setConfig(curConfig);
      setEditCloudName(curConfig.CLOUD_NAME);
      setEditApiKey(curConfig.API_KEY);
      setEditApiSecret(curConfig.API_SECRET);
      setEditPreset(curConfig.UPLOAD_PRESET);
    }
  }, [isOpen]);

  const refreshCatalog = () => {
    setTracks(getVanzTeamTracks());
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judulLagu.trim()) {
      alert("Wajib isi judul lagu!");
      return;
    }

    if (!audioFile && !audioUrlInput.trim()) {
      alert("Wajib pilih file audio .mp3 atau masukkan Link Audio!");
      return;
    }

    if (!coverFile && !coverUrlInput.trim()) {
      alert("Wajib pilih file cover gambar atau masukkan Link Cover!");
      return;
    }

    setIsUploading(true);
    setUploadSuccessMessage(null);

    try {
      const res = await uploadTrackKeCloud(
        judulLagu.trim(),
        audioFile,
        coverFile,
        {
          customAudioUrl: audioUrlInput.trim() || undefined,
          customCoverUrl: coverUrlInput.trim() || undefined,
          customPreset: config.UPLOAD_PRESET
        }
      );

      if (res) {
        const slug = res.publicId || judulLagu.toLowerCase().replace(/\s+/g, '-');
        const newTrack: Track = {
          id: `vanz_${slug}_${Date.now()}`,
          title: judulLagu.trim(),
          artist: 'Vanz Team Music',
          channelTitle: 'Vanz Team Music Official',
          thumbnail: res.coverUrl,
          audioUrl: res.audioUrl,
          duration: '3:45',
          durationSeconds: 225,
          viewCount: 'Rilis Baru • Cloudinary',
          albumName: `${judulLagu.trim()} - Single`,
          source: 'vanz',
          cloudinaryPublicId: slug,
          publishedAt: new Date().toISOString().split('T')[0]
        };

        saveVanzTeamTrack(newTrack);
        refreshCatalog();

        setUploadSuccessMessage(`🔥 Sukses! Lagu "${judulLagu}" berhasil diterbitkan ke katalog Vanz Team Music!`);
        setJudulLagu('');
        setAudioFile(null);
        setCoverFile(null);
        setAudioUrlInput('');
        setCoverUrlInput('');
      }
    } catch (err: any) {
      alert("Gagal mengupload lagu: " + (err.message || String(err)));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLama.trim() || !namaBaru.trim()) {
      alert("Nama lama dan nama baru wajib diisi!");
      return;
    }

    setIsRenaming(true);
    setRenameMessage(null);

    try {
      const ok = await gantiNamaFileMusik(renameType, namaLama.trim(), namaBaru.trim());
      if (ok) {
        setRenameMessage(`📝 Nama file ${renameType} sukses diubah dari "${namaLama}" menjadi "${namaBaru}"!`);
        refreshCatalog();
      }
    } catch (err: any) {
      alert("Gagal mengubah nama: " + (err.message || String(err)));
    } finally {
      setIsRenaming(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      CLOUD_NAME: editCloudName.trim() || config.CLOUD_NAME,
      API_KEY: editApiKey.trim() || config.API_KEY,
      API_SECRET: editApiSecret.trim() || config.API_SECRET,
      UPLOAD_PRESET: editPreset.trim() || config.UPLOAD_PRESET
    };
    saveCloudinaryConfig(updated);
    setConfig(updated);
    setConfigSavedNotice(true);
    setTimeout(() => setConfigSavedNotice(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-[#141417] text-white border border-purple-500/30 shadow-2xl shadow-purple-950/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-950/40 via-black to-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Vanz Team Music Studio</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Cloudinary Cloud
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Pusat Unggah Audio .MP3 & Cover Resmi Tim Vanz Music
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-white/10 bg-neutral-950/40">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'upload'
                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Lagu Baru</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'catalog'
                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Katalog Vanz Team ({tracks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rename')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'rename'
                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Ganti Nama File</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'config'
                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Kredensial API</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: UPLOAD LAGU */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-200">
                  <p className="font-semibold text-white mb-0.5">
                    Upload Audio .MP3 & Cover Sekaligus ke Cloudinary
                  </p>
                  <p className="text-purple-300/80">
                    File audio dan gambar akan dihubungkan secara otomatis dengan format slug ID lagu. 
                    Lagu yang diterbitkan langsung dapat diputar dengan Dolby Atmos dan lirik sinkronisasi.
                  </p>
                </div>
              </div>

              {uploadSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Judul Lagu
                  </label>
                  <input
                    type="text"
                    value={judulLagu}
                    onChange={(e) => setJudulLagu(e.target.value)}
                    placeholder="Contoh: Langkah Akhir"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-purple-500"
                    required
                  />
                  {judulLagu && (
                    <span className="text-[11px] text-neutral-400 mt-1 block">
                      Slug ID: <code className="text-purple-400">{judulLagu.toLowerCase().replace(/\s+/g, '-')}</code>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* File Audio Input */}
                  <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-white">
                      <Music className="w-4 h-4 text-purple-400" />
                      <span>File Mentah Audio (.mp3, .wav)</span>
                    </label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-neutral-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                    />
                    <div className="text-[11px] text-neutral-400">Atau tempel Link Audio URL:</div>
                    <input
                      type="url"
                      value={audioUrlInput}
                      onChange={(e) => setAudioUrlInput(e.target.value)}
                      placeholder="https://.../lagu.mp3"
                      className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* File Cover Input */}
                  <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-white">
                      <ImageIcon className="w-4 h-4 text-pink-400" />
                      <span>File Mentah Gambar Cover</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-neutral-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-pink-600 file:text-white hover:file:bg-pink-500 cursor-pointer"
                    />
                    <div className="text-[11px] text-neutral-400">Atau tempel Link Gambar Cover:</div>
                    <input
                      type="url"
                      value={coverUrlInput}
                      onChange={(e) => setCoverUrlInput(e.target.value)}
                      placeholder="https://.../cover.jpg"
                      className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-neutral-400">
                    Target Cloud: <span className="text-white font-mono">{config.CLOUD_NAME}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengupload ke Cloud...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Terbitkan Lagu ke Vanz Music</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: KATALOG LAGU */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Daftar Lagu Vanz Team Music</h3>
                  <p className="text-xs text-neutral-400">
                    Lagu resmi Vanz Team Music dengan pemutaran audio lossless & Dolby Atmos
                  </p>
                </div>
                <button
                  onClick={refreshCatalog}
                  className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 p-1.5 rounded-lg hover:bg-white/5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Segarkan</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {tracks.map((track) => {
                  const isThisPlaying = currentTrack?.id === track.id && isPlaying;
                  return (
                    <div
                      key={track.id}
                      className="p-3 rounded-2xl bg-neutral-900/80 border border-white/5 hover:border-purple-500/30 flex items-center justify-between gap-3 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          className="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0 ring-1 ring-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                            {(track.id === 'vanz_langkah_di_tanah_tua' || track.id === 'vanz_langkah_akhir') && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 font-semibold border border-purple-400/30">
                                Single Baru
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 truncate">
                            {track.artist} • {track.albumName || 'Official Audio'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                            <span>ID: {track.cloudinaryPublicId || track.id}</span>
                            <span>•</span>
                            <span>{track.duration || '3:30'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => playTrack(track, tracks)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isThisPlaying ? 'Putar' : 'Dengarkan'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setNamaLama(track.cloudinaryPublicId || track.title.toLowerCase().replace(/\s+/g, '-'));
                            setActiveTab('rename');
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                          title="Ganti Nama File di Cloudinary"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {track.id !== 'vanz_langkah_akhir' && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus lagu "${track.title}" dari katalog?`)) {
                                deleteVanzTeamTrack(track.id);
                                refreshCatalog();
                              }
                            }}
                            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors"
                            title="Hapus Lagu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: GANTI NAMA FILE */}
          {activeTab === 'rename' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-neutral-900 border border-white/10 space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-purple-400" />
                  <span>Fungsi Ganti Nama Audio / Cover via Cloudinary API</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Mengubah public_id file di Cloudinary menggunakan Basic Authentication token gabungan API_KEY dan API_SECRET.
                </p>
              </div>

              {renameMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{renameMessage}</span>
                </div>
              )}

              <form onSubmit={handleRenameSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Tipe File
                  </label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                      renameType === 'video'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-neutral-900 border-white/10 text-neutral-400'
                    }`}>
                      <input
                        type="radio"
                        name="renameType"
                        value="video"
                        checked={renameType === 'video'}
                        onChange={() => setRenameType('video')}
                        className="hidden"
                      />
                      <Music className="w-4 h-4" />
                      <span>Audio File (video)</span>
                    </label>

                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                      renameType === 'image'
                        ? 'bg-pink-600/20 border-pink-500 text-pink-300'
                        : 'bg-neutral-900 border-white/10 text-neutral-400'
                    }`}>
                      <input
                        type="radio"
                        name="renameType"
                        value="image"
                        checked={renameType === 'image'}
                        onChange={() => setRenameType('image')}
                        className="hidden"
                      />
                      <ImageIcon className="w-4 h-4" />
                      <span>Gambar Cover (image)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Nama File Lama (public_id)
                  </label>
                  <input
                    type="text"
                    value={namaLama}
                    onChange={(e) => setNamaLama(e.target.value)}
                    placeholder="Contoh: langkah-akhir"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-purple-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Nama File Baru (public_id yang diinginkan)
                  </label>
                  <input
                    type="text"
                    value={namaBaru}
                    onChange={(e) => setNamaBaru(e.target.value)}
                    placeholder="Contoh: lagu-final-vanz"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-purple-500 font-mono"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isRenaming}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                  >
                    {isRenaming ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengubah nama...</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4" />
                        <span>Ubah Nama via API</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: KREDENSIAL API */}
          {activeTab === 'config' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-neutral-900 border border-white/10 flex items-start gap-3">
                <Key className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-neutral-300">
                  <p className="font-semibold text-white mb-0.5">Kredensial Akun Cloudinary</p>
                  <p className="text-neutral-400">
                    Nilai default telah diisi sesuai kredensial yang Anda berikan. 
                    Anda dapat memperbarui API Key, API Secret, atau Unsigned Preset kapan saja dari dashboard Cloudinary Anda.
                  </p>
                </div>
              </div>

              {configSavedNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Kredensial Cloudinary berhasil diperbarui dan disimpan!</span>
                </div>
              )}

              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Cloud Name
                  </label>
                  <input
                    type="text"
                    value={editCloudName}
                    onChange={(e) => setEditCloudName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={editApiKey}
                    onChange={(e) => setEditApiKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    API Secret
                  </label>
                  <input
                    type="text"
                    value={editApiSecret}
                    onChange={(e) => setEditApiSecret(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Upload Preset (Unsigned)
                  </label>
                  <input
                    type="text"
                    value={editPreset}
                    onChange={(e) => setEditPreset(e.target.value)}
                    placeholder="unsigned_preset_lu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Jika memakai Unsigned Upload dari dashboard Cloudinary (Settings &gt; Upload &gt; Upload Presets).
                  </span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
