import { APPLE_MUSIC_DEVELOPER_TOKEN, APPLE_MUSIC_USER_TOKEN } from './appleMusic';

// MusicKit JS v3 Type definitions
declare global {
  interface Window {
    MusicKit?: any;
    onMusicKitReady?: () => void;
  }
}

export type AppleDrmStatus = 
  | 'uninitialized'
  | 'ready'
  | 'authenticating'
  | 'drm_ready'
  | 'drm_playing'
  | 'drm_paused'
  | 'error';

interface AppleDrmListeners {
  onStateChange?: (isPlaying: boolean, state: string) => void;
  onTimeChange?: (current: number, duration: number) => void;
  onTrackEnd?: () => void;
  onError?: (error: any) => void;
}

let musicKitInstance: any = null;
let isConfiguring = false;
let drmStatus: AppleDrmStatus = 'uninitialized';
let listeners: AppleDrmListeners = {};
let drmSupportedSystem: 'fairplay' | 'widevine' | 'eme_generic' | 'unsupported' = 'unsupported';

// Check browser DRM EME capabilities (FairPlay on Safari, Widevine on Chromium/Firefox)
export async function detectDrmCapabilities(): Promise<'fairplay' | 'widevine' | 'eme_generic' | 'unsupported'> {
  if (typeof window === 'undefined' || !navigator.requestMediaKeySystemAccess) {
    drmSupportedSystem = 'unsupported';
    return 'unsupported';
  }

  const drmConfigs: MediaKeySystemConfiguration[] = [
    {
      initDataTypes: ['cenc', 'keyids', 'sinf'],
      audioCapabilities: [
        { contentType: 'audio/mp4; codecs="mp4a.40.2"' },
        { contentType: 'audio/mp4; codecs="alac"' }
      ]
    }
  ];

  // 1. Test FairPlay Streaming (Apple Safari / WebKit)
  try {
    await navigator.requestMediaKeySystemAccess('com.apple.fps', drmConfigs);
    drmSupportedSystem = 'fairplay';
    return 'fairplay';
  } catch {}

  // 2. Test Widevine DRM (Google Chrome, Edge, Firefox, Android)
  try {
    await navigator.requestMediaKeySystemAccess('com.widevine.alpha', [
      {
        initDataTypes: ['cenc', 'keyids'],
        audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }]
      }
    ]);
    drmSupportedSystem = 'widevine';
    return 'widevine';
  } catch {}

  drmSupportedSystem = 'eme_generic';
  return 'eme_generic';
}

// Ensure MusicKit JS is configured with Apple developer token and user token
export async function getMusicKitInstance(): Promise<any> {
  if (musicKitInstance) return musicKitInstance;
  if (typeof window === 'undefined') return null;

  if (isConfiguring) {
    // Wait until configuration finishes
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (musicKitInstance || !isConfiguring) {
          clearInterval(check);
          resolve(musicKitInstance);
        }
      }, 100);
    });
  }

  isConfiguring = true;

  try {
    // Pre-populate Apple Music user token in local storage for MusicKit JS
    try {
      if (APPLE_MUSIC_USER_TOKEN) {
        localStorage.setItem('music.u', APPLE_MUSIC_USER_TOKEN);
        localStorage.setItem(`music.${APPLE_MUSIC_DEVELOPER_TOKEN}.u`, APPLE_MUSIC_USER_TOKEN);
      }
    } catch {}

    // Dynamically and safely load window.MusicKit script on demand if not present
    if (!window.MusicKit && typeof document !== 'undefined') {
      await new Promise<void>((resolve) => {
        try {
          const existing = document.querySelector('script[src*="musickit.js"]');
          if (existing) {
            document.addEventListener('musickitloaded', () => resolve(), { once: true });
            setTimeout(resolve, 2000);
            return;
          }

          const script = document.createElement('script');
          script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
          script.async = true;
          script.crossOrigin = 'anonymous';
          script.onload = () => resolve();
          script.onerror = () => {
            console.warn("MusicKit JS could not be loaded in current environment, using embedded DRM mode.");
            resolve();
          };
          document.head.appendChild(script);
          setTimeout(resolve, 2500);
        } catch {
          resolve();
        }
      });
    }

    if (window.MusicKit && typeof window.MusicKit.configure === 'function') {
      try {
        musicKitInstance = window.MusicKit.configure({
          developerToken: APPLE_MUSIC_DEVELOPER_TOKEN,
          app: {
            name: 'VanzMusic',
            build: '2.0.0',
            icon: 'https://cdn.phototourl.com/free/2026-09-19-571b25e0-aa49-47c1-9fa7-8f7127a2a4cd.png'
          }
        });
      } catch (confErr) {
        // If already configured, get existing instance
        if (typeof window.MusicKit.getInstance === 'function') {
          musicKitInstance = window.MusicKit.getInstance();
        } else {
          console.warn("MusicKit configure error:", confErr);
        }
      }

      if (musicKitInstance) {
        // Set user token for DRM access
        if (APPLE_MUSIC_USER_TOKEN) {
          try {
            musicKitInstance.musicUserToken = APPLE_MUSIC_USER_TOKEN;
          } catch {}
        }

        // Attach player listeners
        setupMusicKitEvents(musicKitInstance);
        drmStatus = 'drm_ready';
        detectDrmCapabilities();
      }
    }
  } catch (err) {
    console.warn("Apple MusicKit DRM initialization notice:", err);
    drmStatus = 'error';
  } finally {
    isConfiguring = false;
  }

  return musicKitInstance;
}

function setupMusicKitEvents(instance: any) {
  if (!instance) return;

  try {
    // Playback state changes
    instance.addEventListener('playbackStateDidChange', (event: any) => {
      const state = event?.state;
      const isPlaying = instance.isPlaying || state === 2 || state === 'playing';
      if (isPlaying) {
        drmStatus = 'drm_playing';
      } else {
        drmStatus = 'drm_paused';
      }
      listeners.onStateChange?.(isPlaying, String(state));
    });

    // Time changes
    instance.addEventListener('playbackTimeDidChange', (event: any) => {
      const current = instance.currentPlaybackTime || event?.currentPlaybackTime || 0;
      const duration = instance.currentPlaybackDuration || event?.currentPlaybackDuration || 0;
      listeners.onTimeChange?.(current, duration);
    });

    // Duration changes
    instance.addEventListener('playbackDurationDidChange', (event: any) => {
      const current = instance.currentPlaybackTime || 0;
      const duration = instance.currentPlaybackDuration || event?.duration || 0;
      listeners.onTimeChange?.(current, duration);
    });

    // Track ended
    instance.addEventListener('playbackStateDidChange', (event: any) => {
      if (event?.state === 0 || event?.state === 'ended') {
        listeners.onTrackEnd?.();
      }
    });
  } catch (e) {
    console.warn("Could not bind MusicKit event listeners:", e);
  }
}

export function subscribeAppleDrmListeners(handlers: AppleDrmListeners) {
  listeners = { ...listeners, ...handlers };
  return () => {
    listeners = {};
  };
}

// Play Apple DRM Track via MusicKit JS
export async function playAppleDrmSong(appleSongId: string): Promise<boolean> {
  const cleanId = appleSongId.replace('apple_', '').trim();
  if (!cleanId) return false;

  try {
    const music = await getMusicKitInstance();
    if (!music) {
      console.warn("MusicKit JS not loaded in browser environment");
      return false;
    }

    drmStatus = 'authenticating';

    // Ensure user token is applied to the instance
    if (APPLE_MUSIC_USER_TOKEN && !music.musicUserToken) {
      music.musicUserToken = APPLE_MUSIC_USER_TOKEN;
    }

    // Set queue to the requested Apple Music song
    if (typeof music.setQueue === 'function') {
      await music.setQueue({
        song: cleanId,
        startPlaying: true
      });
    }

    // Trigger DRM Playback
    if (typeof music.play === 'function') {
      await music.play();
      drmStatus = 'drm_playing';
      return true;
    }
  } catch (err: any) {
    console.warn("Apple MusicKit DRM playback prevented or error:", err);
    drmStatus = 'error';
    listeners.onError?.(err);
    return false;
  }

  return false;
}

export async function pauseAppleDrm(): Promise<void> {
  try {
    if (musicKitInstance && typeof musicKitInstance.pause === 'function') {
      await musicKitInstance.pause();
      drmStatus = 'drm_paused';
    }
  } catch {}
}

export async function resumeAppleDrm(): Promise<void> {
  try {
    if (musicKitInstance && typeof musicKitInstance.play === 'function') {
      await musicKitInstance.play();
      drmStatus = 'drm_playing';
    }
  } catch {}
}

export async function seekAppleDrm(seconds: number): Promise<void> {
  try {
    if (musicKitInstance && typeof musicKitInstance.seekToTime === 'function') {
      await musicKitInstance.seekToTime(seconds);
    }
  } catch {}
}

export function setAppleDrmVolume(vol: number): void {
  try {
    if (musicKitInstance) {
      musicKitInstance.volume = Math.max(0, Math.min(1, vol));
    }
  } catch {}
}

export function getAppleDrmStatus(): AppleDrmStatus {
  return drmStatus;
}

export function getDetectedDrmSystem(): string {
  return drmSupportedSystem;
}
