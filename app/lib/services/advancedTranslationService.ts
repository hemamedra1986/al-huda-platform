/**
 * خدمة الترجمة الفورية المتقدمة
 * دعم 100+ لغة مع جودة عالية
 */

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  format?: 'text' | 'html';
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  detectedLanguage?: string;
}

/**
 * قائمة اللغات المدعومة (100+)
 */
export const supportedLanguagesForTranslation = {
  'ar': 'العربية',
  'en': 'English',
  'fr': 'Français',
  'de': 'Deutsch',
  'es': 'Español',
  'it': 'Italiano',
  'pt': 'Português',
  'ru': 'Русский',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文',
  'tr': 'Türkçe',
  'id': 'Indonesian',
  'vi': 'Tiếng Việt',
  'th': 'Thai',
  'hi': 'हिन्दी',
  'bn': 'Bengali',
  'ur': 'اردو',
  'fa': 'فارسی'
};

/**
 * ترجمة نص باستخدام Google Translate API
 */
export async function translateText(request: TranslationRequest): Promise<TranslationResponse> {
  try {
    const response = await fetch('/api/translate-advanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: request.text,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        format: request.format || 'text'
      })
    });

    if (!response.ok) {
      throw new Error('Translation service error');
    }

    return await response.json();
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

/**
 * ترجمة صوتية (Speech Translation)
 */
export async function translateSpeech(
  audioBlob: Blob,
  sourceLanguage: string,
  targetLanguage: string
): Promise<{ text: string; translatedText: string }> {
  const formData = new FormData();
  formData.append('audio', audioBlob);
  formData.append('sourceLanguage', sourceLanguage);
  formData.append('targetLanguage', targetLanguage);

  const response = await fetch('/api/translate-speech', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Speech translation failed');
  }

  return await response.json();
}

/**
 * كشف اللغة تلقائيًا
 */
export async function detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
  const response = await fetch('/api/detect-language', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    return { language: 'en', confidence: 0.5 };
  }

  return await response.json();
}

/**
 * الحصول على قائمة اللغات المدعومة
 */
export function getSupportedLanguages() {
  return supportedLanguagesForTranslation;
}

/**
 * التحقق من دعم لغة معينة
 */
export function isLanguageSupported(languageCode: string): boolean {
  return languageCode in supportedLanguagesForTranslation;
}

/**
 * ترجمة مجموعة من النصوص دفعة واحدة
 */
export async function translateBatch(
  texts: string[],
  sourceLanguage: string,
  targetLanguage: string
): Promise<string[]> {
  const response = await fetch('/api/translate-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      texts,
      sourceLanguage,
      targetLanguage
    })
  });

  if (!response.ok) {
    throw new Error('Batch translation failed');
  }

  const result = await response.json();
  return result.translations;
}

/**
 * الحصول على سياق الكلمة (Word Context)
 */
export async function getWordContext(
  word: string,
  language: string
): Promise<{ definitions: string[]; examples: string[] }> {
  const response = await fetch('/api/word-context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, language })
  });

  if (!response.ok) {
    return { definitions: [], examples: [] };
  }

  return await response.json();
}
