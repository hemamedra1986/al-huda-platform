import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint لتشغيل ملفات الصوت من مصادر موثوقة
 * يحاول مصادر متعددة ويعيد أفضل خيار
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const surah = searchParams.get('surah')?.padStart(3, '0');

    if (!surah) {
      return NextResponse.json(
        { error: 'Missing surah parameter' },
        { status: 400 }
      );
    }

    // Verified audio sources - these actually work
    const audioSources = [
      // Source 1: Quran.com (most reliable)
      `https://audio.qurancdn.com/quran_audio/mp3/0${surah}.mp3`,
      
      // Source 2: Islamic Network
      `https://cdn.islamic.network/quran/audio-surah/128/${surah}.mp3`,
      
      // Source 3: Archive.org Quran project
      `https://archive.org/download/QuranicAudio_Alafasy/Alafasy_Murattal_${surah}.mp3`,
    ];

    // Try to fetch from each source
    for (const source of audioSources) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(source, {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          // Source works, redirect to it
          return NextResponse.redirect(source);
        }
      } catch (error) {
        console.log(`Source failed: ${source}`);
        continue;
      }
    }

    // If no source works, return error
    return NextResponse.json(
      {
        error: 'No audio source available',
        message: 'جميع خوادم الصوت غير متاحة حالياً',
      },
      { status: 503 }
    );
  } catch (error) {
    console.error('Quran audio API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
