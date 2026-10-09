import { LyricLine, LyricsResult, LyricsSearchCandidate } from '../types';
import { CURATED_OFFLINE_LYRICS } from './curatedLyrics';
import { getSavedLyrics, saveCustomLyrics } from './indexedDB';

// Helper to insert Apple Music-style 3-dot ('•••') markers for intros and long instrumental gaps
export function withInstrumentalMarkers(rawLines: LyricLine[]): LyricLine[] {
  if (!rawLines || rawLines.length === 0) return [];

  const sorted = [...rawLines].sort((a, b) => a.time - b.time);
  const result: LyricLine[] = [];

  const isDotLine = (text: string) =>
    text === '•••' ||
    text === '...' ||
    text === '…' ||
    /^[\s♪♫•.…*-]+$/.test(text) ||
    /^\[?(intro|instrumental|musik|music|interlude|outro|solo)\]?$/i.test(text.trim());

  // 1. Add intro marker at 0s if the first vocal starts after 1.5s and isn't already a dot marker
  if (sorted[0].time > 1.5 && !isDotLine(sorted[0].text)) {
    result.push({ time: 0, text: '•••' });
  }

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const normalizedText = isDotLine(current.text) ? '•••' : current.text;

    // Avoid duplicate consecutive '•••' lines
    if (normalizedText === '•••' && result.length > 0 && result[result.length - 1].text === '•••') {
      continue;
    }

    result.push({
      time: current.time,
      text: normalizedText
    });

    // 2. Check if there is a long instrumental gap before the next line
    const next = sorted[i + 1];
    if (next && normalizedText !== '•••' && !isDotLine(next.text)) {
      const gap = next.time - current.time;
      // Estimate normal singing time based on word count (~0.45s per word, min 3s, max 5.5s)
      const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;
      const estimatedVocalDuration = Math.min(5.5, Math.max(3.0, wordCount * 0.45));
      // If silent gap after estimated singing is at least 4.5s (total gap >= ~8s), insert '•••'
      if (gap - estimatedVocalDuration >= 4.5) {
        result.push({
          time: Number((current.time + estimatedVocalDuration).toFixed(2)),
          text: '•••'
        });
      }
    }
  }

  return result;
}

// Parse standard LRC format string: "[mm:ss.xx] lyric line text"
export function parseLRC(lrcText: string): LyricLine[] {
  if (!lrcText || typeof lrcText !== 'string') return [];
  
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];

  for (const line of lines) {
    // Matches formats like [01:23.45], [01:23.4], [01:23]
    const match = line.match(/\[(\d{2}):(\d{2}(?:\.\d+)?)\](.*)/);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseFloat(match[2]);
      const text = match[3].trim();
      // Skip metadata headers like "[ar:...]"
      if (text.startsWith('ar:') || text.startsWith('ti:') || text.startsWith('al:') || text.startsWith('by:')) {
        continue;
      }
      const timeVal = Number((mins * 60 + secs).toFixed(2));
      if (text) {
        result.push({
          time: timeVal,
          text: text
        });
      } else {
        // Blank timestamped line in LRC represents end of vocal / instrumental break
        result.push({
          time: timeVal,
          text: '•••'
        });
      }
    }
  }

  return withInstrumentalMarkers(result);
}

// Convert plain un-synced text lyrics into evenly spaced lyric lines based on duration
export function convertPlainLyricsToLines(plainText: string, durationSeconds = 210): LyricLine[] {
  if (!plainText) return [];
  const lines = plainText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('[') && !l.endsWith(']'));

  if (lines.length === 0) return [];

  // Start after intro (usually 8-12s) and end before outro
  const startOffset = Math.min(10, Math.max(3, durationSeconds * 0.05));
  const effectiveDuration = Math.max(20, durationSeconds - startOffset - 15);
  const timeStep = effectiveDuration / lines.length;

  const rawLines = lines.map((text, idx) => ({
    time: Number((startOffset + idx * timeStep).toFixed(1)),
    text
  }));

  return withInstrumentalMarkers(rawLines);
}

// Clean title and artist to increase match rate on LRCLIB and lyrics databases
export function normalizeTrackMeta(title: string, artist: string) {
  let cleanT = title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/feat\..*/i, '')
    .replace(/ft\..*/i, '')
    .replace(/official video/gi, '')
    .replace(/official music video/gi, '')
    .replace(/official audio/gi, '')
    .replace(/music video/gi, '')
    .replace(/lyric(s)? video/gi, '')
    .replace(/video lirik/gi, '')
    .replace(/audio/gi, '')
    .replace(/hd|4k/gi, '')
    .trim();

  let cleanA = artist
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/feat\..*/i, '')
    .replace(/ft\..*/i, '')
    .replace(/official/gi, '')
    .replace(/vevo/gi, '')
    .trim();

  if (cleanA === "Artis Populer" || cleanA.toLowerCase().includes("topic")) {
    cleanA = "";
  }

  return { cleanT, cleanA };
}

// Fetch authentic official lyrics from LRCLIB & public lyric registries
export async function fetchRealTrackLyrics(
  title: string, 
  artist: string, 
  trackId?: string, 
  durationSeconds = 210
): Promise<LyricsResult> {
  // 1. Check user-saved / custom edited lyrics in IndexedDB first
  if (trackId) {
    try {
      const saved = await getSavedLyrics(trackId);
      if (saved && saved.lyrics.length > 0) {
        return {
          ...saved,
          lyrics: withInstrumentalMarkers(saved.lyrics)
        };
      }
    } catch (e) {
      console.warn("Could not load saved lyrics:", e);
    }
  }

  const { cleanT, cleanA } = normalizeTrackMeta(title, artist);

  // 2. Check Curated 100% Genuine Synced Lyrics Database
  const lookupKey = cleanT.toLowerCase().trim();
  for (const [key, item] of Object.entries(CURATED_OFFLINE_LYRICS)) {
    if (lookupKey.includes(key) || key.includes(lookupKey)) {
      return {
        trackId,
        title: item.title,
        artist: item.artist,
        isSynced: true,
        source: 'curated_synced',
        lyrics: withInstrumentalMarkers(item.lyrics)
      };
    }
  }

  // 3. Search LRCLIB (Direct precise search)
  try {
    const searchParams = new URLSearchParams();
    if (cleanT) searchParams.append('track_name', cleanT);
    if (cleanA) searchParams.append('artist_name', cleanA);

    // Try specific search endpoint first
    let res = await fetch(`https://lrclib.net/api/get?${searchParams.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.syncedLyrics) {
        const parsed = parseLRC(data.syncedLyrics);
        if (parsed.length > 0) {
          return {
            trackId,
            title: data.trackName || title,
            artist: data.artistName || artist,
            isSynced: true,
            source: 'lrclib_synced',
            lyrics: parsed,
            plainLyrics: data.plainLyrics
          };
        }
      } else if (data?.plainLyrics) {
        const lines = convertPlainLyricsToLines(data.plainLyrics, durationSeconds);
        return {
          trackId,
          title: data.trackName || title,
          artist: data.artistName || artist,
          isSynced: false,
          source: 'lrclib_plain',
          lyrics: lines,
          plainLyrics: data.plainLyrics
        };
      }
    }

    // 4. Try general query search on LRCLIB if exact query failed
    const query = cleanA ? `${cleanT} ${cleanA}` : cleanT;
    const queryRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
    if (queryRes.ok) {
      const searchResults = await queryRes.json();
      if (Array.isArray(searchResults) && searchResults.length > 0) {
        // Prioritize synced lyrics
        const bestSynced = searchResults.find(r => r.syncedLyrics && r.syncedLyrics.length > 20);
        if (bestSynced) {
          const parsed = parseLRC(bestSynced.syncedLyrics);
          if (parsed.length > 0) {
            return {
              trackId,
              title: bestSynced.trackName || title,
              artist: bestSynced.artistName || artist,
              isSynced: true,
              source: 'lrclib_synced',
              lyrics: parsed,
              plainLyrics: bestSynced.plainLyrics
            };
          }
        }

        // Second fallback: plain lyrics
        const bestPlain = searchResults.find(r => r.plainLyrics && r.plainLyrics.length > 20);
        if (bestPlain) {
          const lines = convertPlainLyricsToLines(bestPlain.plainLyrics, durationSeconds);
          return {
            trackId,
            title: bestPlain.trackName || title,
            artist: bestPlain.artistName || artist,
            isSynced: false,
            source: 'lrclib_plain',
            lyrics: lines,
            plainLyrics: bestPlain.plainLyrics
          };
        }
      }
    }
  } catch (err) {
    console.warn("LRCLIB fetch error:", err);
  }

  // 5. Fallback: Secondary lyric provider (lyrics.ovh for plain real lyrics)
  try {
    if (cleanT && cleanA) {
      const ovhRes = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanA)}/${encodeURIComponent(cleanT)}`);
      if (ovhRes.ok) {
        const ovhData = await ovhRes.json();
        if (ovhData.lyrics && ovhData.lyrics.length > 20) {
          const lines = convertPlainLyricsToLines(ovhData.lyrics, durationSeconds);
          return {
            trackId,
            title,
            artist,
            isSynced: false,
            source: 'lrclib_plain',
            lyrics: lines,
            plainLyrics: ovhData.lyrics
          };
        }
      }
    }
  } catch (e) {
    console.warn("Lyrics.ovh fetch error:", e);
  }

  // If completely not found in any database, return not_found so user can search or enter lyrics
  return {
    trackId,
    title,
    artist,
    isSynced: false,
    source: 'not_found',
    lyrics: []
  };
}

// User-triggered manual lyrics search on LRCLIB
export async function searchLyricsManual(query: string): Promise<LyricsSearchCandidate[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query.trim())}`);
    if (!res.ok) return [];
    const items = await res.json();
    if (!Array.isArray(items)) return [];

    return items.map((item: any) => ({
      id: item.id,
      trackName: item.trackName,
      artistName: item.artistName,
      albumName: item.albumName,
      duration: item.duration,
      isSynced: Boolean(item.syncedLyrics),
      syncedLyrics: item.syncedLyrics,
      plainLyrics: item.plainLyrics
    }));
  } catch (err) {
    console.error("Manual lyrics search failed:", err);
    return [];
  }
}

// Apply selected candidate to track and persist to IndexedDB
export async function applyCandidateLyrics(
  candidate: LyricsSearchCandidate, 
  trackId: string, 
  durationSeconds = 210
): Promise<LyricsResult> {
  let lyrics: LyricLine[] = [];
  let isSynced = false;

  if (candidate.syncedLyrics) {
    lyrics = parseLRC(candidate.syncedLyrics);
    isSynced = true;
  } else if (candidate.plainLyrics) {
    lyrics = convertPlainLyricsToLines(candidate.plainLyrics, durationSeconds);
    isSynced = false;
  }

  const result: LyricsResult = {
    trackId,
    title: candidate.trackName,
    artist: candidate.artistName,
    isSynced,
    source: isSynced ? 'lrclib_synced' : 'lrclib_plain',
    lyrics,
    plainLyrics: candidate.plainLyrics
  };

  await saveCustomLyrics(result);
  return result;
}

// Save user-pasted manual LRC or plain text lyrics
export async function saveUserManualLyrics(
  rawText: string, 
  trackId: string, 
  title: string, 
  artist: string, 
  durationSeconds = 210
): Promise<LyricsResult> {
  let lyrics: LyricLine[] = [];
  let isSynced = false;

  // Check if text contains timestamps [mm:ss]
  if (/\[\d{2}:\d{2}/.test(rawText)) {
    lyrics = parseLRC(rawText);
    isSynced = true;
  } else {
    lyrics = convertPlainLyricsToLines(rawText, durationSeconds);
    isSynced = false;
  }

  const result: LyricsResult = {
    trackId,
    title,
    artist,
    isSynced,
    source: 'user_manual',
    lyrics,
    plainLyrics: rawText
  };

  await saveCustomLyrics(result);
  return result;
}
