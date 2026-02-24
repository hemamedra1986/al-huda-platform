// خدمة كشف اللغة من موقع الزائر الجغرافي

interface UserLocation {
  country: string;
  countryCode: string;
  language: string;
  language_code: string;
}

const languageMap: { [key: string]: string } = {
  // الدول العربية
  'SA': 'ar', // السعودية
  'AE': 'ar', // الإمارات
  'EG': 'ar', // مصر
  'JO': 'ar', // الأردن
  'KW': 'ar', // الكويت
  'QA': 'ar', // قطر
  'BH': 'ar', // البحرين
  'OM': 'ar', // عمان
  'YE': 'ar', // اليمن
  'SY': 'ar', // سوريا
  'LB': 'ar', // لبنان
  'PS': 'ar', // فلسطين
  'IQ': 'ar', // العراق
  'TN': 'ar', // تونس
  'DZ': 'ar', // الجزائر
  'MA': 'ar', // المغرب
  'SD': 'ar', // السودان
  
  // الدول الإنجليزية
  'US': 'en',
  'GB': 'en',
  'AU': 'en',
  'CA': 'en',
  'IE': 'en',
  
  // الدول الفرنسية
  'FR': 'fr',
  'BE': 'fr',
  'CH': 'fr',
  
  // الدول الألمانية
  'DE': 'de',
  'AT': 'de',
  
  // الدول الإسبانية
  'ES': 'es',
  'MX': 'es',
};

export async function detectUserLanguage(): Promise<string> {
  try {
    // استخدام API endpoint الخاص بنا بدلاً من الاتصال المباشر (يتجنب CORS)
    const response = await fetch('/api/geolocation');
    
    if (!response.ok) {
      throw new Error('Failed to fetch geolocation');
    }
    
    const data = await response.json();
    const countryCode = data.country_code || 'US';
    const detectedLanguage = languageMap[countryCode] || 'en';
    
    return detectedLanguage;
  } catch (error) {
    console.error('Error detecting user language:', error);
    // الإرجاع الافتراضي: العربية
    return 'ar';
  }
}

export const supportedLanguages = {
  ar: { name: 'العربية', dir: 'rtl' },
  en: { name: 'English', dir: 'ltr' },
  fr: { name: 'Français', dir: 'ltr' },
  de: { name: 'Deutsch', dir: 'ltr' },
  es: { name: 'Español', dir: 'ltr' },
};

export type SupportedLanguage = keyof typeof supportedLanguages;
