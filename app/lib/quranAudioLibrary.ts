// Centralized Quran audio source library
// Provides ordered list of candidate audio URLs for a given reciter and surah

export function padSurah(n: number) {
  return String(n).padStart(3, '0');
}

export function getAudioSources(reciterId: string, surahNumber: number): string[] {
  const surah = padSurah(surahNumber);

  // Common CDN / mirrors patterns (ordered by reliability)
  const sources: string[] = [];

  // 0) Locally uploaded file (highest priority)
  sources.push(`/audio/uploads/surah_${surah}_${reciterId}.mp3`);

  // 1) QuranCDN style (some servers host with 0-prefixed folder)
  sources.push(`https://audio.qurancdn.com/quran_audio/mp3/0${surah}.mp3`);

  // 2) Islamic Network CDN (commonly available)
  sources.push(`https://cdn.islamic.network/quran/audio-surah/128/${surah}.mp3`);

  // 3) Archive.org mirrors for Afasy (and some other public uploads)
  // Many archive paths include the reciter name; include Afasy as a tested option
  if (reciterId === 'afasy' || reciterId === 'mishary' || reciterId === 'al-afasy') {
    sources.push(`https://archive.org/download/QuranicAudio_Alafasy/Alafasy_Murattal_${surah}.mp3`);
  } else {
    // Generic archive fallback (may exist for some reciters)
    sources.push(`https://archive.org/download/QuranicAudio/Surah_${surah}.mp3`);
  }

  // 4) Mirror / third-party fallback (non-guaranteed) - keep last
  sources.push(`https://cdn2.islamic.network/quran/audio-surah/64/${surah}.mp3`);

  return sources;
}

export default getAudioSources;
