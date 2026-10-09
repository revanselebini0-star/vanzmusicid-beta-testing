import React, { useState } from 'react';
import { Track } from '../types';

const MusicPlayerExample: React.FC = () => {
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const BASE_URL = "https://server-kappa-black-72.vercel.app";

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      console.log('Hasil pencarian:', data);
      if (Array.isArray(data)) {
        const mapped: Track[] = data.map((item: any) => ({
          id: item.id || item.videoId || Math.random().toString(),
          title: item.judul || item.title || 'Unknown Title',
          artist: item.artis || item.artist || 'Unknown Artist',
          album: item.album,
          thumbnail: item.coverArt || item.thumbnail || '',
          durationSeconds: 200,
        }));
        setResults(mapped);
      }
    } catch (error) {
      console.error('Gagal mengambil data lagu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = async (song: Track) => {
    try {
      const response = await fetch(`${BASE_URL}/api/stream?id=${song.id}`);
      const data = await response.json();
      if (data && data.urlAudioMurni) {
        setAudioUrl(data.urlAudioMurni);
        const audioPlayer = document.getElementById('audioPlayer') as HTMLAudioElement;
        if (audioPlayer) {
          audioPlayer.src = data.urlAudioMurni;
          audioPlayer.play().catch(() => {});
        }
      } else {
        alert('Gagal mengambil link audio.');
      }
    } catch (error) {
      console.error('Gagal memutar audio:', error);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto bg-[#1a1a1e] rounded-xl text-white">
      <h2 className="text-xl font-bold mb-4">Vercel Music Player</h2>
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => handleSearch('bernadya satu bulan')}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          {loading ? 'Mencari...' : 'Cari Bernadya'}
        </button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
        {results.map(track => (
          <div key={track.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              {track.thumbnail && (
                <img src={track.thumbnail} alt={track.title} className="w-10 h-10 object-cover rounded" />
              )}
              <div>
                <div className="font-semibold text-sm">{track.title}</div>
                <div className="text-xs text-gray-400">{track.artist}</div>
              </div>
            </div>
            <button 
              onClick={() => handlePlaySong(track)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              Putar
            </button>
          </div>
        ))}
      </div>

      {audioUrl && (
        <div className="mt-4 p-3 bg-white/10 rounded-xl">
          <div className="text-xs text-gray-300 mb-2">Audio Player:</div>
          <audio id="audioPlayer" src={audioUrl} controls autoPlay className="w-full" />
        </div>
      )}
    </div>
  );
};

export default MusicPlayerExample;
