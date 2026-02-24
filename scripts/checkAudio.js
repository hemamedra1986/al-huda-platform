(async () => {
  const urls = [
    'https://audio.qurancdn.com/quran_audio/mp3/0001.mp3',
    'https://cdn.islamic.network/quran/audio-surah/128/001.mp3',
    'https://archive.org/download/QuranicAudio_Alafasy/Alafasy_Murattal_001.mp3',
    'https://cdn2.islamic.network/quran/audio-surah/64/001.mp3',
    'http://localhost:3000/api/quran-audio?surah=001',
    'http://localhost:3000/api/proxy-audio?surah=001&reciter=afasy'
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u, { method: 'HEAD' });
      console.log(u, res.status, res.headers.get('content-type'));
    } catch (err) {
      console.error(u, 'ERROR', err && err.message ? err.message : err);
    }
  }
})();
