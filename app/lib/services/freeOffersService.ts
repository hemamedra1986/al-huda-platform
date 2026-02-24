/**
 * خدمة العروض المجانية والمزايا الأساسية
 */

export interface FreeOffer {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  icon2x: string;
  category: "course" | "consultation" | "lesson" | "feature";
  valueInSAR: number; // القيمة الأصلية
  duration?: string;
  features: string[];
}

export interface SuccessStory {
  nameAr: string;
  nameEn: string;
  achievement: string;
  image: string;
  rating: number;
}

// العروض المجانية والطبقات
export const FREE_OFFERS: FreeOffer[] = [
  {
    id: "free-registration",
    titleAr: "التسجيل المجاني",
    titleEn: "Free Registration",
    descriptionAr: "أنشئ حسابك مجاناً وابدأ رحلتك الروحية",
    descriptionEn: "Create your free account and start your spiritual journey",
    icon: "📝",
    icon2x: "✍️",
    category: "feature",
    valueInSAR: 0,
    duration: "مدى الحياة",
    features: [
      "تسجيل سريع وآمن",
      "إمكانية حفظ التقدم",
      "الوصول للموارد المجانية",
    ],
  },
  {
    id: "free-quran-listening",
    titleAr: "القرآن الكريم مجاناً",
    titleEn: "Free Quran Access",
    descriptionAr: "استمع للقرآن الكامل بأصوات أفضل القراء",
    descriptionEn: "Listen to the entire Quran with the best reciters",
    icon: "📖",
    icon2x: "🕋️",
    category: "feature",
    valueInSAR: 299,
    duration: "غير محدود",
    features: [
      "المصحف الكامل",
      "4 قراء مشهورين",
      "بحث بسيط",
      "تحميل الآيات",
    ],
  },
  {
    id: "free-beginner-course",
    titleAr: "دورة البداية المجانية",
    titleEn: "Free Beginner Course",
    descriptionAr: "دورة أساسية في أحكام التجويد والقراءة الصحيحة",
    descriptionEn: "Fundamental course in Tajweed and correct recitation",
    icon: "🎓",
    icon2x: "📚",
    category: "course",
    valueInSAR: 599,
    duration: "4 أسابيع",
    features: [
      "مقدمة في التجويد",
      "5 دروس فيديو",
      "تمارين عملية",
      "شهادة إتمام",
    ],
  },
  {
    id: "free-consultation",
    titleAr: "استشارة واحدة مجانية",
    titleEn: "One Free Consultation",
    descriptionAr: "استشارة شخصية مع متخصص لمدة 20 دقيقة",
    descriptionEn: "Personal consultation with a specialist for 20 minutes",
    icon: "👥",
    icon2x: "💬",
    category: "consultation",
    valueInSAR: 149,
    duration: "20 دقيقة",
    features: [
      "استشارة فردية",
      "حل لمشاكلك الروحية",
      "نصائح شخصية",
      "خطة عمل مخصصة",
    ],
  },
  {
    id: "free-first-lesson",
    titleAr: "أول حصة مجانية مع الشيخ",
    titleEn: "First Free Lesson with Sheikh",
    descriptionAr: "درس قرآني تجريبي مع أحد الشيوخ المتخصصين",
    descriptionEn: "Trial Quranic lesson with a specialized sheikh",
    icon: "👨‍🏫",
    icon2x: "🎤",
    category: "lesson",
    valueInSAR: 200,
    duration: "30 دقيقة",
    features: [
      "درس تقويمي",
      "تقييم مستويات القراءة",
      "خطة تعليمية مخصصة",
      "نصائح لتحسين القراءة",
    ],
  },
  {
    id: "free-reading-tutor",
    titleAr: "برنامج التدريب المجاني",
    titleEn: "Free Training Program",
    descriptionAr: "تدريب على القراءة مع تصحيح فوري للأخطاء",
    descriptionEn: "Reading practice with instant error correction",
    icon: "🎤",
    icon2x: "✨",
    category: "feature",
    valueInSAR: 449,
    duration: "غير محدود",
    features: [
      "تصحيح بالذكاء الاصطناعي",
      "تقييم دقيق للقراءة",
      "تقارير مفصلة",
      "تدريب مستمر",
    ],
  },
];

// المميزات الأساسية للمستخدمين الجدد
export const STARTER_FEATURES = [
  {
    titleAr: "مجاني للأبد",
    titleEn: "Free Forever",
    descriptionAr: "جميع المميزات الأساسية بدون تكلفة",
    descriptionEn: "All basic features at no cost",
    icon: "💰",
  },
  {
    titleAr: "بدون بيانات بنكية",
    titleEn: "No Card Required",
    descriptionAr: "لا تحتاج لبطاقة ائتمان عند التسجيل",
    descriptionEn: "No credit card needed to register",
    icon: "🚫",
  },
  {
    titleAr: "سهل الاستخدام",
    titleEn: "Easy to Use",
    descriptionAr: "واجهة بسيطة وسهلة التصفح",
    descriptionEn: "Simple and intuitive interface",
    icon: "😊",
  },
  {
    titleAr: "دعم كامل",
    titleEn: "Full Support",
    descriptionAr: "فريق الدعم متاح 24/7",
    descriptionEn: "Support team available 24/7",
    icon: "🤝",
  },
];

// قصص النجاح
export const SUCCESS_STORIES: SuccessStory[] = [
  {
    nameAr: "محمد علي",
    nameEn: "Muhammad Ali",
    achievement: "حفظ القرآن الكريم بالكامل في سنة واحدة",
    image: "👨",
    rating: 5,
  },
  {
    nameAr: "فاطمة أحمد",
    nameEn: "Fatima Ahmed",
    achievement: "أتقنت القراءة الصحيحة وبدأت التدريس",
    image: "👩",
    rating: 5,
  },
  {
    nameAr: "عمر العتيبي",
    nameEn: "Umar Al-Otaibi",
    achievement: "تحسنت قراءته وانضم للجماعة",
    image: "👨",
    rating: 4.9,
  },
];

export function getFreeOfferById(id: string): FreeOffer | undefined {
  return FREE_OFFERS.find(offer => offer.id === id);
}

export function getFreeOffersByCategory(category: string): FreeOffer[] {
  return FREE_OFFERS.filter(offer => offer.category === category);
}

export function getTotalFreeValue(): number {
  return FREE_OFFERS.reduce((total, offer) => total + offer.valueInSAR, 0);
}
