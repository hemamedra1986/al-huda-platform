import { NextRequest, NextResponse } from 'next/server';
import getAudioSources from '@/app/lib/quranAudioLibrary';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const surahRaw = searchParams.get('surah');
    const reciter = searchParams.get('reciter') || 'afasy';

    if (!surahRaw) {
      return NextResponse.json({ error: 'Missing surah parameter' }, { status: 400 });
    }

    const surahNum = parseInt(surahRaw, 10);
    if (Number.isNaN(surahNum)) {
      return NextResponse.json({ error: 'Invalid surah parameter' }, { status: 400 });
    }

    const candidates = getAudioSources(reciter, surahNum);

    const probeResults: Array<{ source: string; status?: number; error?: string }> = [];

    for (const src of candidates) {
      try {
        const urlToFetch = src.startsWith('/') ? new URL(src, request.url).toString() : src;

        // First try a light HEAD probe with browser-like headers
        try {
          const headRes = await fetch(urlToFetch, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'audio/*,*/*;q=0.9',
              Referer: request.headers.get('referer') || `http://${request.headers.get('host')}/`,
            },
          });

          probeResults.push({ source: urlToFetch, status: headRes.status });

          if (headRes.ok) {
            // HEAD succeeded — now GET and stream
            const upstream = await fetch(urlToFetch, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept: 'audio/*,*/*;q=0.9',
                Range: 'bytes=0-',
                Referer: request.headers.get('referer') || `http://${request.headers.get('host')}/`,
              },
            });

            if (upstream.ok) {
              const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
              const headers = new Headers();
              headers.set('Content-Type', contentType);
              headers.set('Cache-Control', 'public, max-age=3600');
              return new NextResponse(upstream.body, { status: 200, headers });
            }
            // if GET failed despite HEAD OK, record and continue
            probeResults.push({ source: urlToFetch, status: upstream.status, error: `GET failed` });
            continue;
          }
        } catch (headErr) {
          // HEAD may be blocked; try GET directly as fallback probe
          probeResults.push({ source: urlToFetch, error: String(headErr) });
          try {
            const upstream = await fetch(urlToFetch, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept: 'audio/*,*/*;q=0.9',
                Range: 'bytes=0-',
                Referer: request.headers.get('referer') || `http://${request.headers.get('host')}/`,
              },
            });

            if (upstream.ok) {
              const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
              const headers = new Headers();
              headers.set('Content-Type', contentType);
              headers.set('Cache-Control', 'public, max-age=3600');
              return new NextResponse(upstream.body, { status: 200, headers });
            }
            probeResults.push({ source: urlToFetch, status: upstream.status });
            continue;
          } catch (getErr) {
            probeResults.push({ source: urlToFetch, error: String(getErr) });
            continue;
          }
        }
      } catch (err) {
        probeResults.push({ source: src, error: String(err) });
        continue;
      }
    }

    // none worked — return richer diagnostic info
    return NextResponse.json({ error: 'No available audio sources', probes: probeResults }, { status: 503 });

    return NextResponse.json({ error: 'No available audio sources' }, { status: 503 });
  } catch (err) {
    console.error('proxy-audio error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
