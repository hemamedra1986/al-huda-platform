/**
 * خدمة SEO العالمية
 * تحسين محركات البحث للموقع متعدد اللغات
 */

export interface MetaTags {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  ogUrl: string;
  twitterCardType: 'summary' | 'summary_large_image' | 'app' | 'player';
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

/**
 * Meta tags لكل صفحة
 */
export const pageMetaTags: { [key: string]: { [lang: string]: MetaTags } } = {
  '/': {
    ar: {
      title: 'منصة الهُدى - المنصة الإسلامية الشاملة',
      description: 'منصة تعليمية إسلامية متكاملة للعلوم الشرعية وحفظ القرآن والاستشارات',
      keywords: ['إسلام', 'تعليم', 'قرآن', 'استشارات', 'علوم شرعية'],
      ogImage: '/og-image-ar.png',
      ogUrl: 'https://al-huda.com/ar',
      twitterCardType: 'summary_large_image'
    },
    en: {
      title: 'Al-Huda Platform - Comprehensive Islamic Learning',
      description: 'Integrated Islamic educational platform for Quranic sciences, consultations, and religious learning',
      keywords: ['Islam', 'education', 'Quran', 'consultations', 'Islamic sciences'],
      ogImage: '/og-image-en.png',
      ogUrl: 'https://al-huda.com/en',
      twitterCardType: 'summary_large_image'
    }
  },
  '/courses': {
    ar: {
      title: 'العلوم الشرعية - كورسات إسلامية متخصصة',
      description: 'كورسات شرعية من متخصصين معتمدين مع شهادات معترف بها',
      keywords: ['كورسات', 'علوم شرعية', 'تعليم إسلامي', 'شهادات'],
      ogImage: '/og-courses-ar.png',
      ogUrl: 'https://al-huda.com/ar/courses',
      twitterCardType: 'summary'
    },
    en: {
      title: 'Islamic Courses - Specialized Religious Learning',
      description: 'Certified Islamic courses from expert instructors with recognized certificates',
      keywords: ['courses', 'Islamic science', 'education', 'certificates'],
      ogImage: '/og-courses-en.png',
      ogUrl: 'https://al-huda.com/en/courses',
      twitterCardType: 'summary'
    }
  },
  '/consultations': {
    ar: {
      title: 'الاستشارات الشرعية - خصوصية مضمونة',
      description: 'استشارات فردية مع علماء متخصصين مع حماية كاملة للخصوصية',
      keywords: ['استشارات', 'فتاوى', 'علماء', 'حلال وحرام'],
      ogImage: '/og-consultations-ar.png',
      ogUrl: 'https://al-huda.com/ar/consultations',
      twitterCardType: 'summary'
    },
    en: {
      title: 'Islamic Consultations - Private Expert Advice',
      description: 'One-on-one consultations with Islamic scholars with complete privacy protection',
      keywords: ['consultations', 'fatwa', 'scholars', 'Islamic guidance'],
      ogImage: '/og-consultations-en.png',
      ogUrl: 'https://al-huda.com/en/consultations',
      twitterCardType: 'summary'
    }
  },
  '/quran': {
    ar: {
      title: 'تصحيح القرآن - تحسين التلاوة والحفظ',
      description: 'برنامج متقدم لتصحيح التلاوة ومتابعة الحفظ مع تغذية راجعة فقاهة',
      keywords: ['قرآن', 'تصحيح تلاوة', 'حفظ', 'تجويد'],
      ogImage: '/og-quran-ar.png',
      ogUrl: 'https://al-huda.com/ar/quran',
      twitterCardType: 'summary'
    },
    en: {
      title: 'Quran Mastery - Tajweed & Memorization',
      description: 'Advanced program for Quranic recitation correction and memorization tracking',
      keywords: ['Quran', 'tajweed', 'memorization', 'Islamic'],
      ogImage: '/og-quran-en.png',
      ogUrl: 'https://al-huda.com/en/quran',
      twitterCardType: 'summary'
    }
  }
};

/**
 * البيانات المهيكلة (Schema.org)
 */
export const structuredDataTemplates = {
  organization: (): StructuredData => ({
    '@context': 'https://schema.org/',
    '@type': 'Organization',
    name: 'Al-Huda Platform',
    url: 'https://al-huda.com',
    logo: 'https://al-huda.com/logo.png',
    description: 'Comprehensive Islamic educational platform',
    sameAs: [
      'https://twitter.com/alhudaplatform',
      'https://facebook.com/alhudaplatform',
      'https://instagram.com/alhudaplatform'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@al-huda.com',
      telephone: '+966-XXX-XXXXX'
    }
  }),

  course: (title: string, description: string, instructor: string): StructuredData => ({
    '@context': 'https://schema.org/',
    '@type': 'Course',
    name: title,
    description: description,
    provider: {
      '@type': 'Organization',
      name: 'Al-Huda Platform'
    },
    instructor: {
      '@type': 'Person',
      name: instructor
    },
    offers: {
      '@type': 'Offer',
      price: '49',
      priceCurrency: 'SAR',
      availability: 'https://schema.org/InStock'
    }
  }),

  breadcrumb: (items: Array<{ name: string; url: string }>): StructuredData => ({
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  })
};

/**
 * توليد sitemap XML
 */
export function generateSitemap(baseUrl: string, languages: string[]): string {
  const pages = ['', '/courses', '/consultations', '/quran', '/voice', '/chat', '/subscriptions'];
  
  const urls = pages.flatMap(page =>
    languages.map(lang => ({
      loc: `${baseUrl}/${lang}${page}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: page === '' ? 'weekly' : 'monthly',
      priority: page === '' ? 1.0 : 0.8
    }))
  );

  const xmlUrls = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${xmlUrls}
</urlset>`;
}

/**
 * الحصول على Meta Tags لصفحة معينة
 */
export function getMetaTags(page: string, language: string = 'ar'): MetaTags | null {
  return pageMetaTags[page]?.[language] || null;
}

/**
 * توليد robots.txt
 */
export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /
Allow: /ar/
Allow: /en/
Allow: /fr/
Allow: /de/
Allow: /es/
Disallow: /admin/
Disallow: /api/
Disallow: /.env
Disallow: /private/

Sitemap: https://al-huda.com/sitemap.xml

User-agent: Googlebot
Allow: /

User-agent: bingbot
Allow: /

Crawl-delay: 1`;
}

/**
 * تحسين الكلمات المفتاحية
 */
export function getKeywordsSuggestions(topic: string, language: string): string[] {
  const keywordMap: { [key: string]: string[] } = {
    'ar_courses': ['كورسات إسلامية', 'علوم شرعية', 'تعليم ديني', 'دروس إسلامية'],
    'ar_quran': ['تصحيح قرآن', 'حفظ القرآن', 'تجويد', 'تلاوة'],
    'en_courses': ['Islamic courses', 'Islamic education', 'Quran courses', 'Islamic learning'],
    'en_quran': ['Quran recitation', 'Quran memorization', 'Tajweed', 'Islamic studies']
  };

  return keywordMap[`${language}_${topic}`] || [];
}

/**
 * إنشاء إشعارات Rich Snippets للبحث
 */
export function generateRichSnippets(type: 'review' | 'rating' | 'price'): StructuredData {
  const templates: { [key: string]: StructuredData } = {
    review: {
      '@context': 'https://schema.org/',
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '4.8',
        bestRating: '5'
      },
      reviewBody: 'منصة رائعة للتعليم الإسلامي!'
    },
    rating: {
      '@context': 'https://schema.org/',
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '2500',
      bestRating: '5'
    },
    price: {
      '@context': 'https://schema.org/',
      '@type': 'PriceSpecification',
      priceCurrency: 'SAR',
      price: '49'
    }
  };

  return templates[type];
}
