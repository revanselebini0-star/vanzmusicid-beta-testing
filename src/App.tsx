import React, { useState } from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { Sidebar } from './components/Sidebar';
import { TabBar } from './components/TabBar';
import { MiniPlayer } from './components/MiniPlayer';
import { FullPlayerModal } from './components/FullPlayerModal';
import { PlaylistModal } from './components/PlaylistModal';
import { ListenNowView } from './components/views/ListenNowView';
import { RecommendationsView } from './components/views/RecommendationsView';
import { SearchView } from './components/views/SearchView';
import { LibraryView } from './components/views/LibraryView';
import { AccountView } from './components/views/AccountView';
import { AiView } from './components/views/AiView';
import { Track } from './types';
import { motion, AnimatePresence } from 'motion/react';

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    ytContainerId, 
    isVideoMode, 
    isFullPlayerOpen,
    currentTrack 
  } = usePlayer();

  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [trackForPlaylist, setTrackForPlaylist] = useState<Track | null>(null);

  const handleOpenPlaylistModal = (track?: Track) => {
    setTrackForPlaylist(track || null);
    setPlaylistModalOpen(true);
  };

  const handleClosePlaylistModal = () => {
    setPlaylistModalOpen(false);
    setTrackForPlaylist(null);
  };

  return (
    <div className="min-h-screen bg-[#141416] text-white flex font-sans selection:bg-[#fa2d48]/30 overflow-x-hidden">
      {/* Permanent YouTube Player Container for uninterrupted playback */}
      <div 
        id="vanz-yt-wrapper" 
        className={
          isVideoMode && isFullPlayerOpen
            ? "fixed z-[60] top-16 left-1/2 -translate-x-1/2 w-[90%] max-w-lg aspect-video rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20 bg-black"
            : "fixed -top-[9999px] -left-[9999px] w-1 h-1 pointer-events-none opacity-0"
        }
      >
        <div id={ytContainerId} className="w-full h-full" />
      </div>

      {/* Left Sidebar matching the reference exactly */}
      <Sidebar 
        onCreatePlaylistClick={() => handleOpenPlaylistModal()} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto pb-24 sm:pb-8">
        <main className="flex-1 px-4 sm:px-10 py-6 sm:py-8 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <SearchView onOpenPlaylistModal={handleOpenPlaylistModal} />
              </motion.div>
            )}

            {activeTab === 'listen_now' && (
              <motion.div
                key="listen_now"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <ListenNowView onOpenPlaylistModal={handleOpenPlaylistModal} />
              </motion.div>
            )}

            {(activeTab === 'recommendations' || activeTab === 'radio') && (
              <motion.div
                key="recommendations"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <RecommendationsView onOpenPlaylistModal={handleOpenPlaylistModal} />
              </motion.div>
            )}

            {activeTab === 'library' && (
              <motion.div
                key="library"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <LibraryView 
                  onCreatePlaylistClick={() => handleOpenPlaylistModal()}
                  onOpenPlaylistModal={handleOpenPlaylistModal} 
                />
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <AiView />
              </motion.div>
            )}

            {activeTab === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <AccountView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom Floating Rounded Pill Player Bar */}
      <MiniPlayer />

      {/* Mobile Bottom Tab Navigation */}
      <TabBar />

      {/* Full-Screen Music Player with Synced Lyrics */}
      <FullPlayerModal 
        onAddToPlaylist={() => {
          if (currentTrack) handleOpenPlaylistModal(currentTrack);
        }} 
      />

      {/* Modal to Create/Add to Personal Playlist (IndexedDB) */}
      <PlaylistModal
        isOpen={playlistModalOpen}
        onClose={handleClosePlaylistModal}
        trackToAdd={trackForPlaylist}
      />
    </div>
  );
};

export default function App() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
}
