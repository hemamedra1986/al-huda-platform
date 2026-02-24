import { NextRequest, NextResponse } from 'next/server';

/**
 * API Endpoint للترجمة الفورية
 * هذا نسخة محاكاة لـ Google Translate
 */

// محاكاة قاموس الترجمة
const translations: { [key: string]: { [key: string]: string } } = {
  'السلام عليكم ورحمة الله وبركاته، كيف يمكنني مساعدتك؟': {
    en: 'Hello and peace be upon you, how can I help you?',
    fr: 'Bonjour et la paix soit sur vous, comment puis-je vous aider?',
  },
  'شكراً على سؤالك، هذا موضوع مهم جداً. دعني أشرح لك بالتفصيل...': {
    en: 'Thank you for your question. This is a very important topic. Let me explain in detail...',
    fr: 'Merci pour votre question. C\'est un sujet très important. Laissez-moi vous l\'expliquer en détail...',
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLanguage, sourceLanguage = 'auto' } = body;

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'text and targetLanguage are required' },
        { status: 400 }
      );
    }

    // البحث في القاموس
    let translatedText = translations[text]?.[targetLanguage];

    // إذا لم نجد الترجمة، استخدم محاكاة بسيطة
    if (!translatedText) {
      // في الواقع ستستخدم Google Translate API أو API ترجمة حقيقي
      // هنا نستخدم محاكاة بسيطة فقط للتطوير
      translatedText = `[${targetLanguage.toUpperCase()}] ${text}`;
    }

    return NextResponse.json({
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
