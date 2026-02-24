// Centralized Quran audio source library
// Provides ordered list of candidate audio URLs for a given reciter and surah

export function padSurah(n: number) {
  return String(n).padStart(3, '0');
}

// Mapping from internal reciter IDs to cdn.islamic.network reciter identifiers
const RECITER_CDN_IDS: Record<string, string> = {
  'afasy': 'ar.alafasy',
  'abdel-basset': 'ar.abdulsamad',
  'hussari': 'ar.husary',
  'minshawi': 'ar.minshawimujawwad',
};

// Mapping from internal reciter IDs to archive.org folder names
const RECITER_ARCHIVE_IDS: Record<string, string> = {
  'afasy': 'Alafasy_128kbps',
  'abdel-basset': 'AbdulSamad_128kbps',
  'hussari': 'Husary_128kbps',
  'minshawi': 'Minshawi_Murattal_128kbps',
};

export function getAudioSources(reciterId: string, surahNumber: number): string[] {
  const surah = padSurah(surahNumber);
  const surahNum = String(surahNumber); // unpadded for some CDNs

  const cdnReciter = RECITER_CDN_IDS[reciterId] || 'ar.alafasy';
  const archiveReciter = RECITER_ARCHIVE_IDS[reciterId] || 'Alafasy_128kbps';

  // Common CDN / mirrors patterns (ordered by reliability)
  const sources: string[] = [];

  // 1) Islamic Network CDN with reciter-specific path (most reliable, CORS-friendly)
  sources.push(`https://cdn.islamic.network/quran/audio-surah/128/${cdnReciter}/${surahNum}.mp3`);

  // 2) Islamic Network CDN fallback (64kbps)
  sources.push(`https://cdn.islamic.network/quran/audio-surah/64/${cdnReciter}/${surahNum}.mp3`);

  // 3) Archive.org reciter-specific folder
  sources.push(`https://archive.org/download/${archiveReciter}/${surah}.mp3`);

  // 4) QuranCDN style (some servers host with 0-prefixed folder)
  sources.push(`https://audio.qurancdn.com/quran_audio/mp3/0${surah}.mp3`);

  // 5) Generic archive.org fallback for Afasy
  if (reciterId !== 'afasy') {
    sources.push(`https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNum}.mp3`);
  }

  return sources;
}

export default getAudioSources;
