import { NextRequest, NextResponse } from 'next/server';

/**
 * API Endpoint للحصول على معلومات البلد من IP
 * يتجنب مشاكل CORS بمعالجة الطلب في الخادم
 */

export async function GET(request: NextRequest) {
  try {
    // محاولة الحصول على IP من headers
    let clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('cf-connecting-ip') ||
                   '127.0.0.1';

    // استدعاء API الجيوموقع من الخادم (بدون مشاكل CORS)
    const geoResponse = await fetch(`https://ipapi.co/${clientIP}/json/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      }
    });

    if (!geoResponse.ok) {
      throw new Error('Geolocation API error');
    }

    const geoData = await geoResponse.json();

    return NextResponse.json({
      country_code: geoData.country_code || 'US',
      country: geoData.country_name || 'Unknown',
      city: geoData.city || 'Unknown',
      language: geoData.languages?.split(',')[0] || 'en',
      ip: clientIP,
    });
  } catch (error) {
    console.error('Geolocation error:', error);
    
    // إرجاع بيانات افتراضية في حالة الخطأ
    return NextResponse.json({
      country_code: 'US',
      country: 'Unknown',
      city: 'Unknown',
      language: 'en',
      ip: 'unknown',
    });
  }
}
