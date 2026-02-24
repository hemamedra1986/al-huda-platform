/**
 * خدمة إدارة بيانات القرآن الكريم
 */

export interface QuranVerse {
  surahNumber: number;
  verseNumber: number;
  arabicText: string;
  translation?: {
    ar?: string;
    en?: string;
  };
}

export interface Surah {
  number: number;
  nameAr: string;
  nameEn: string;
  versesCount: number;
  revelationType: "مكي" | "مدني";
  description?: string;
}

export interface Reciter {
  id: string;
  nameAr: string;
  nameEn: string;
  style: string;
  image: string;
  rating: number;
  description: string;
  pricePerSession: number; // SAR
}

// بيانات السور القرآنية
export const SURAHS: Surah[] = [
  { number: 1, nameAr: "الفاتحة", nameEn: "Al-Fatiha", versesCount: 7, revelationType: "مكي", description: "فاتحة الكتاب" },
  { number: 2, nameAr: "البقرة", nameEn: "Al-Baqarah", versesCount: 286, revelationType: "مدني", description: "أطول سورة" },
  { number: 3, nameAr: "آل عمران", nameEn: "Aal-E-Imran", versesCount: 200, revelationType: "مدني" },
  { number: 4, nameAr: "النساء", nameEn: "An-Nisa", versesCount: 176, revelationType: "مدني" },
  { number: 5, nameAr: "المائدة", nameEn: "Al-Ma'idah", versesCount: 120, revelationType: "مدني" },
  { number: 6, nameAr: "الأنعام", nameEn: "Al-An'am", versesCount: 165, revelationType: "مكي" },
  { number: 7, nameAr: "الأعراف", nameEn: "Al-A'raf", versesCount: 206, revelationType: "مكي" },
  { number: 8, nameAr: "الأنفال", nameEn: "Al-Anfal", versesCount: 75, revelationType: "مدني" },
  { number: 9, nameAr: "التوبة", nameEn: "At-Tawbah", versesCount: 129, revelationType: "مدني" },
  { number: 10, nameAr: "يونس", nameEn: "Yunus", versesCount: 109, revelationType: "مكي" },
  { number: 11, nameAr: "هود", nameEn: "Hud", versesCount: 123, revelationType: "مكي" },
  { number: 12, nameAr: "يوسف", nameEn: "Yusuf", versesCount: 111, revelationType: "مكي" },
  { number: 13, nameAr: "الرعد", nameEn: "Ar-Ra'd", versesCount: 43, revelationType: "مدني" },
  { number: 14, nameAr: "إبراهيم", nameEn: "Ibrahim", versesCount: 52, revelationType: "مكي" },
  { number: 15, nameAr: "الحجر", nameEn: "Al-Hijr", versesCount: 99, revelationType: "مكي" },
  { number: 16, nameAr: "النحل", nameEn: "An-Nahl", versesCount: 128, revelationType: "مكي" },
  { number: 17, nameAr: "الإسراء", nameEn: "Al-Isra", versesCount: 111, revelationType: "مكي" },
  { number: 18, nameAr: "الكهف", nameEn: "Al-Kahf", versesCount: 110, revelationType: "مكي" },
  { number: 19, nameAr: "مريم", nameEn: "Maryam", versesCount: 98, revelationType: "مكي" },
  { number: 20, nameAr: "طه", nameEn: "Ta-Ha", versesCount: 135, revelationType: "مكي" },
  // ... (السور الباقية - اختصرت للاختصار)
  { number: 114, nameAr: "الناس", nameEn: "An-Nas", versesCount: 6, revelationType: "مكي" },
];

// بيانات القراء المشهورين
export const RECITERS: Reciter[] = [
  {
    id: "abdel-basset",
    nameAr: "عبد الباسط عبد الصمد",
    nameEn: "Abdel-Basset Abdel-Samad",
    style: "تجويد",
    image: "👨‍🎤",
    rating: 5.0,
    description: "من أشهر القراء بصوت جميل وتجويد متقن",
    pricePerSession: 0, // مجاني
  },
  {
    id: "hussari",
    nameAr: "محمود خليل الحصري",
    nameEn: "Mahmoud Khalil Al-Hussary",
    style: "مقروء",
    image: "👨‍🎤",
    rating: 4.9,
    description: "قراءة ترتيل واضحة وسهلة",
    pricePerSession: 0,
  },
  {
    id: "minshawi",
    nameAr: "محمد صديق المنشاوي",
    nameEn: "Muhammad Siddiq Al-Minshawi",
    style: "تجويد",
    image: "👨‍🎤",
    rating: 4.8,
    description: "صوت عذب وتجويد جميل",
    pricePerSession: 0,
  },
  {
    id: "afasy",
    nameAr: "مشاري بن راشد العفاسي",
    nameEn: "Mishary Bin Rashid Al-Afasy",
    style: "تجويد",
    image: "👨‍🎤",
    rating: 4.9,
    description: "قرآن حديث بجودة عالية",
    pricePerSession: 0,
  },
];

// بيانات الآيات - مثال (في الإنتاج ستأتي من قاعدة بيانات)
export const QURAN_VERSES: { [key: number]: QuranVerse[] } = {
  1: [
    { surahNumber: 1, verseNumber: 1, arabicText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" },
    { surahNumber: 1, verseNumber: 2, arabicText: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ" },
    { surahNumber: 1, verseNumber: 3, arabicText: "الرَّحْمَٰنِ الرَّحِيمِ" },
    { surahNumber: 1, verseNumber: 4, arabicText: "مَالِكِ يَوْمِ الدِّينِ" },
    { surahNumber: 1, verseNumber: 5, arabicText: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ" },
    { surahNumber: 1, verseNumber: 6, arabicText: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ" },
    { surahNumber: 1, verseNumber: 7, arabicText: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ" },
  ],
};

export function getSurah(surahNumber: number): Surah | undefined {
  return SURAHS.find(s => s.number === surahNumber);
}

export function getSurahVerses(surahNumber: number): QuranVerse[] {
  return QURAN_VERSES[surahNumber] || [];
}

export function getReciter(reciterId: string): Reciter | undefined {
  return RECITERS.find(r => r.id === reciterId);
}

export function formatArabicNumber(num: number): string {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).split('').map(digit => arabicNumbers[parseInt(digit)]).join('');
}

// حساب عدد الآيات المتبقية في السورة
export function getRemainingVersesCount(surahNumber: number, currentVerse: number): number {
  const surah = getSurah(surahNumber);
  if (!surah) return 0;
  return Math.max(0, surah.versesCount - currentVerse);
}
