// Centralized Quran audio source library
// Provides ordered list of candidate audio URLs for a given reciter and surah

export function padSurah(n: number) {
  return String(n).padStart(3, '0');
}

export function getAudioSources(reciterId: string, surahNumber: number): string[] {
  const surah = padSurah(surahNumber);

  // Common CDN / mirrors patterns (ordered by reliability)
  const sources: string[] = [];

  // 1) QuranCDN style (most reliable)
  sources.push(`https://audio.qurancdn.com/quran_audio/mp3/0${surah}.mp3`);

  // 2) Islamic Network CDN (commonly available)
  sources.push(`https://cdn.islamic.network/quran/audio-surah/128/${surah}.mp3`);

  // 3) Archive.org mirrors for Afasy (and some other public uploads)
  if (reciterId === 'afasy' || reciterId === 'mishary' || reciterId === 'al-afasy') {
    sources.push(`https://archive.org/download/QuranicAudio_Alafasy/Alafasy_Murattal_${surah}.mp3`);
  } else {
    sources.push(`https://archive.org/download/QuranicAudio/Surah_${surah}.mp3`);
  }

  // 4) Islamic Network CDN fallback (lower quality)
  sources.push(`https://cdn2.islamic.network/quran/audio-surah/64/${surah}.mp3`);

  // 5) Locally uploaded file (only if admin uploaded)
  sources.push(`/audio/uploads/surah_${surah}_${reciterId}.mp3`);

  return sources;
}

export default getAudioSources;