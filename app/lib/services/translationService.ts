// خدمة الترجمة الفورية

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

/**
 * ترجمة فورية للنصوص
 * تستخدم Google Translate API
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'auto'
): Promise<TranslationResult> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLanguage,
        sourceLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error('Translation API error');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Translation error:', error);
    return {
      originalText: text,
      translatedText: text,
      sourceLanguage,
      targetLanguage,
    };
  }
}

/**
 * ترجمة فورية للصوت (تحويل كلام إلى نص ثم ترجمة)
 */
export async function translateSpeech(
  audioBlob: Blob,
  targetLanguage: string,
  sourceLanguage: string = 'ar'
): Promise<{
  originalText: string;
  translatedText: string;
  audioUrl: string;
}> {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('targetLanguage', targetLanguage);
    formData.append('sourceLanguage', sourceLanguage);

    const response = await fetch('/api/translate-speech', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Speech translation API error');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Speech translation error:', error);
    throw error;
  }
}

/**
 * قائمة اللغات المدعومة
 */
export const supportedLanguagesForTranslation = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  zh: '中文',
  ja: '日本語',
  ru: 'Русский',
};
