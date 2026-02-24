import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Admin endpoint to upload Quran audio files
 * Stores files locally in public/audio/ directory
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const surah = formData.get('surah') as string;
    const reciter = formData.get('reciter') as string;

    if (!file || !surah || !reciter) {
      return NextResponse.json(
        { error: 'Missing file, surah, or reciter parameter' },
        { status: 400 }
      );
    }

    // Validate surah number
    const surahNum = parseInt(surah, 10);
    if (Number.isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
      return NextResponse.json(
        { error: 'Invalid surah number (must be between 1-114)' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('audio/') && file.type !== 'audio/mpeg') {
      return NextResponse.json(
        { error: 'File must be an audio file (MP3, WAV, etc.)' },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();

    // Create storage directory path
    const uploadDir = join(process.cwd(), 'public', 'audio', 'uploads');

    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (err) {
        console.error('Failed to create upload directory:', err);
      }
    }

    // Generate filename: surah_002_afasy.mp3
    const surahPadded = String(surahNum).padStart(3, '0');
    const filename = `surah_${surahPadded}_${reciter}.mp3`;
    const filepath = join(uploadDir, filename);

    // Write file to disk
    await writeFile(filepath, Buffer.from(buffer));

    // Return public URL path and metadata
    return NextResponse.json({
      success: true,
      message: `Audio file uploaded successfully`,
      file: {
        filename: filename,
        path: `/audio/uploads/${filename}`,
        surah: surahNum,
        reciter: reciter,
        size: file.size,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file: ' + String(error) },
      { status: 500 }
    );
  }
}
