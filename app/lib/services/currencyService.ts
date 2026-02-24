// خدمة العملات والتحويل

export type Currency = 'SAR' | 'AED' | 'EGP' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  direction: 'LTR' | 'RTL';
  exchangeRate: number; // بناءً على الريال السعودي
}

// خريطة الدول والعملات
const countryToCurrency: { [key: string]: Currency } = {
  // الدول العربية
  'SA': 'SAR', // السعودية - الريال السعودي
  'AE': 'AED', // الإمارات - درهم إماراتي
  'EG': 'EGP', // مصر - جنيه مصري
  'JO': 'USD', // الأردن - دولار (أو دينار)
  'KW': 'USD', // الكويت - دولار (أو دينار)
  'QA': 'USD', // قطر - دولار (أو ريال)
  'BH': 'USD', // البحرين - دولار (أو دينار)
  'OM': 'USD', // عمان - دولار (أو ريال)
  'YE': 'USD', // اليمن - دولار (أو ريال)
  'SY': 'USD', // سوريا
  'LB': 'USD', // لبنان
  'PS': 'USD', // فلسطين
  'IQ': 'USD', // العراق
  'TN': 'EUR', // تونس - دينار تونسي
  'DZ': 'EUR', // الجزائر - دينار جزائري
  'MA': 'EUR', // المغرب - درهم مغربي
  'SD': 'USD', // السودان

  // الدول الأوروبية
  'US': 'USD',
  'GB': 'GBP',
  'DE': 'EUR',
  'FR': 'EUR',
  'IT': 'EUR',
  'ES': 'EUR',
  'NL': 'EUR',
  'BE': 'EUR',
  'CH': 'EUR',

  // دول آسيوية
  'JP': 'JPY',
  'CN': 'CNY',
  'IN': 'USD',
  'TH': 'USD',

  // باقي الدول
  'AU': 'USD',
  'CA': 'USD',
};

// معلومات العملات
export const currencyInfo: { [key in Currency]: CurrencyInfo } = {
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    name: 'الريال السعودي',
    direction: 'RTL',
    exchangeRate: 1, // العملة الأساسية
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'درهم إماراتي',
    direction: 'RTL',
    exchangeRate: 0.97, // تقريبي
  },
  EGP: {
    code: 'EGP',
    symbol: 'ج.م',
    name: 'جنيه مصري',
    direction: 'RTL',
    exchangeRate: 12.5, // تقريبي
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'دولار أمريكي',
    direction: 'LTR',
    exchangeRate: 3.75, // تقريبي
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'يورو',
    direction: 'LTR',
    exchangeRate: 4.1, // تقريبي
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'جنيه إسترليني',
    direction: 'LTR',
    exchangeRate: 4.7, // تقريبي
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'ين ياباني',
    direction: 'LTR',
    exchangeRate: 240, // تقريبي
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'يوان صيني',
    direction: 'LTR',
    exchangeRate: 25, // تقريبي
  },
};

/**
 * الحصول على العملة بناءً على رمز الدولة
 */
export function getCurrencyByCountry(countryCode: string): Currency {
  return countryToCurrency[countryCode] || 'USD';
}

/**
 * تحويل السعر من ريال سعودي إلى عملة أخرى
 */
export function convertPrice(sarPrice: number, toCurrency: Currency): number {
  const rate = currencyInfo[toCurrency].exchangeRate;
  return parseFloat((sarPrice * rate).toFixed(2));
}

/**
 * تنسيق السعر للعرض
 */
export function formatPrice(price: number, currency: Currency, isRTL: boolean = false): string {
  const info = currencyInfo[currency];
  const formatted = price.toFixed(2);
  
  if (isRTL || info.direction === 'RTL') {
    return `${formatted} ${info.symbol}`; // 100.00 ر.س
  } else {
    return `${info.symbol} ${formatted}`; // $100.00
  }
}

/**
 * الحصول على معلومات العملة
 */
export function getCurrencyInfo(currency: Currency): CurrencyInfo {
  return currencyInfo[currency];
}

/**
 * تحويل كامل السعر مع الحصول على العملة
 */
export function getPriceInCurrency(sarPrice: number, countryCode: string, isRTL: boolean = false): {
  price: number;
  currency: Currency;
  formatted: string;
  currencyName: string;
} {
  const currency = getCurrencyByCountry(countryCode);
  const convertedPrice = convertPrice(sarPrice, currency);
  const formatted = formatPrice(convertedPrice, currency, isRTL);
  const currencyName = currencyInfo[currency].name;

  return {
    price: convertedPrice,
    currency,
    formatted,
    currencyName,
  };
}
