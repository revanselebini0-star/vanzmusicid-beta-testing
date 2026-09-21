import React, { useState, useRef, useEffect } from 'react';
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
import { VanzUpdateView } from './components/views/VanzUpdateView';
import { Track } from './types';
import { motion, AnimatePresence } from 'motion/react';

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    ytContainerId, 
    isVideoMode, 
    isFullPlayerOpen,
    currentTrack,
    setIsBottomBarsVisible 
  } = usePlayer();

  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [trackForPlaylist, setTrackForPlaylist] = useState<Track | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentY = el.scrollTop;
          const diff = currentY - lastScrollY.current;

          // Always visible near top of page (including iOS pull-down bounce)
          if (currentY <= 25) {
            setIsBottomBarsVisible(true);
            lastScrollY.current = Math.max(0, currentY);
            ticking.current = false;
            return;
          }

          // Prevent false triggers on iOS bottom bounce
          const maxScroll = el.scrollHeight - el.clientHeight;
          if (maxScroll > 0 && currentY >= maxScroll - 20) {
            lastScrollY.current = currentY;
            ticking.current = false;
            return;
          }

          // Scroll down past threshold -> hide bottom bars
          if (diff > 8 && currentY > 40) {
            setIsBottomBarsVisible(false);
          } 
          // Scroll up past threshold -> show bottom bars
          else if (diff < -6) {
            setIsBottomBarsVisible(true);
          }

          lastScrollY.current = currentY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [setIsBottomBarsVisible]);

  // Always restore bottom bars on tab navigation
  useEffect(() => {
    setIsBottomBarsVisible(true);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [activeTab, setIsBottomBarsVisible]);

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
      <div 
        ref={scrollContainerRef}
        className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto pb-24 sm:pb-8"
      >
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

            {activeTab === 'playlist' && (
              <motion.div
                key="playlist"
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

            {activeTab === 'vanzupdate' && (
              <motion.div
                key="vanzupdate"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <VanzUpdateView />
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
