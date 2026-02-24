# 🛠️ دليل المطورين - منصة الهُدى

## البدء السريع

### المتطلبات
```bash
Node.js >= 18.0
npm >= 9.0
Git
VS Code (مع extensions)
```

### التثبيت
```bash
git clone https://github.com/yourusername/al-huda-platform.git
cd al-huda-platform
npm install
npm run dev
```

الموقع يعمل على: http://localhost:3000

---

## البنية المعمارية

```
app/
├── api/                    # API Routes
│   ├── geolocation/       # الموقع الجغرافي
│   ├── translate*/        # الترجمة
│   ├── payments/          # الدفع
│   └── ...
├── pages/                  # صفحات التطبيق
│   ├── courses/           # الدورات
│   ├── consultations/     # الاستشارات
│   ├── quran/            # القرآن
│   ├── voice/            # الغرف الصوتية
│   ├── chat/             # الشات
│   └── subscriptions/    # الاشتراكات
├── components/            # React Components
│   └── Navigation.tsx
├── lib/                   # المكتبات المشتركة
│   ├── firebase.ts
│   └── services/
│       ├── languageDetector.ts
│       ├── translationService.ts
│       ├── currencyService.ts
│       ├── voiceRoomService.ts        # ✨ جديد
│       ├── advancedTranslationService.ts  # ✨ جديد
│       ├── paymentService.ts          # ✨ جديد
│       └── seoService.ts              # ✨ جديد
└── globals.css            # أنماط عالمية
```

---

## الخدمات الرئيسية

### 1. **Voice Room Service** 🎧
**الملف:** `app/lib/services/voiceRoomService.ts`

```typescript
import { 
  VoiceRoom, 
  createVoiceRoom,
  getRoomStats 
} from "@/app/lib/services/voiceRoomService";

// إنشاء غرفة جديدة
const room = createVoiceRoom(
  'اسم الغرفة',
  'الوصف',
  'اسم المضيف'
);

// الحصول على الإحصائيات
const stats = getRoomStats(room);
// { totalParticipants, capacity, duration, ... }
```

### 2. **Advanced Translation Service** 🌐
**الملف:** `app/lib/services/advancedTranslationService.ts`

```typescript
import { translateText } from "@/app/lib/services/advancedTranslationService";

// ترجمة نص
const result = await translateText({
  text: 'مرحبا',
  sourceLanguage: 'ar',
  targetLanguage: 'en',
  format: 'text'
});
// { translatedText: 'Hello', confidence: 0.95, ... }
```

### 3. **Payment Service** 💳
**الملف:** `app/lib/services/paymentService.ts`

```typescript
import { createPaymentIntent } from "@/app/lib/services/paymentService";

// إنشاء نية دفع
const intent = await createPaymentIntent(
  'userId',
  'professional', // plan
  'SAR',         // currency
  'stripe'       // method
);
```

### 4. **SEO Service** 🔍
**الملف:** `app/lib/services/seoService.ts`

```typescript
import { generateSitemap, getMetaTags } from "@/app/lib/services/seoService";

// الحصول على meta tags
const tags = getMetaTags('/courses', 'ar');

// توليد sitemap
const sitemap = generateSitemap('https://al-huda.com', ['ar', 'en']);
```

---

## API Endpoints

### الجيوموقع
```
GET /api/geolocation
└─ { country_code, country, city, language, ip }
```

### الترجمة
```
POST /api/translate-advanced
├─ body: { text, sourceLanguage, targetLanguage }
└─ response: { translatedText, confidence, ... }

POST /api/translate-batch
GET /api/detect-language
POST /api/translate-speech
```

### الدفع
```
POST /api/payments/create-intent
├─ { userId, plan, currency, method }
└─ response: { id, amount, status, ... }

POST /api/payments/stripe
POST /api/payments/paypal
POST /api/payments/bank-transfer
```

---

## اتفاقيات الترميز

### TypeScript
```typescript
// ✅ استخدم interfaces
interface User {
  id: string;
  name: string;
  language: 'ar' | 'en' | 'fr';
}

// ✅ تجنب any
const value: unknown = await fetch(...);

// ✅ استخدم union types
type Status = 'pending' | 'active' | 'canceled';
```

### React Components
```typescript
// ✅ استخدم functional components
export default function MyComponent() {
  return <div>...</div>;
}

// ✅ حدد props types
interface MyProps {
  title: string;
  count?: number; // optional
}

// ✅ استخدم useCallback للدوال
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);
```

### CSS & Styling
```typescript
// ✅ استخدم inline styles مع TypeScript
const styles: React.CSSProperties = {
  backgroundColor: '#1a3a52',
  padding: '20px',
  borderRadius: '12px'
};

// ✅ تجنب CSS modules غير الضرورية
// استخدم Tailwind أو inline styles
```

---

## أفضل الممارسات

### الأداء
```typescript
// ✅ استخدم lazy loading
const VoiceComponent = lazy(() => import('./VoiceComponent'));

// ✅ memoize المكونات الثقيلة
export default memo(MyComponent);

// ✅ استخدم useCallback للدوال
const memoizedCallback = useCallback(fn, [dependencies]);

// ✅ code splitting بـ Next.js
import dynamic from 'next/dynamic';
const Component = dynamic(() => import('./Component'));
```

### الأمان
```typescript
// ✅ التحقق من inputs
if (!text || text.trim().length === 0) {
  throw new Error('Invalid input');
}

// ✅ استخدام environment variables
const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

// ✅ CORS headers
response.headers.set('Access-Control-Allow-Origin', 'https://al-huda.com');

// ✅ rate limiting
// استخدم middleware للتحقق من الحد الأقصى
```

### الاختبار
```typescript
// ✅ unit tests
import { test, expect } from 'vitest';

test('should translate text correctly', async () => {
  const result = await translateText({...});
  expect(result.translatedText).toBeDefined();
});

// ✅ integration tests
// استخدم Jest + Supertest

// ✅ e2e tests
// استخدم Playwright أو Cypress
```

---

## إدارة الحالة

### useState للحالة البسيطة
```typescript
const [count, setCount] = useState(0);
const [isMuted, setIsMuted] = useState(false);
```

### useReducer للحالة المعقدة
```typescript
const [state, dispatch] = useReducer(roomReducer, initialState);

dispatch({ type: 'ADD_PARTICIPANT', payload: participant });
```

### Context API للمشاركة العالمية
```typescript
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }) {
  // ...
}

export function useAuth() {
  return useContext(AuthContext);
}
```

---

## المتغيرات البيئية

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

# APIs (server-side فقط)
GOOGLE_TRANSLATE_API_KEY=xxx
STRIPE_SECRET_KEY=xxx
STRIPE_PUBLISHABLE_KEY=xxx
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
```

---

## سير العمل (Workflow)

### 1. إنشاء فرع جديد
```bash
git checkout -b feature/voice-improvements
```

### 2. التطوير المحلي
```bash
npm run dev
# اختبر التغييرات على http://localhost:3000
```

### 3. الاختبار
```bash
npm run lint      # ESLint
npm run test      # Jest
npm run build     # اختبر البناء
```

### 4. Commit
```bash
git add .
git commit -m "feat: improve voice rooms UI"
# استخدم conventional commits
```

### 5. Push و Pull Request
```bash
git push origin feature/voice-improvements
# افتح PR على GitHub
```

### 6. Code Review
- راجع على الأقل شخص واحد
- تأكد من اجتياز جميع الاختبارات
- ادمج (merge) عند الموافقة

---

## التصحيح (Debugging)

### Browser DevTools
```javascript
// في الكونسول
> debugger; // قف هنا
> console.log(variable);
> console.table(data);
```

### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"]
    }
  ]
}
```

### Network Tab
```
DevTools > Network
- تابع جميع الطلبات
- تحقق من الأخطاء
- راقب الأداء
```

---

## التوثيق

### JSDoc
```typescript
/**
 * ترجمة نص
 * @param text - النص المراد ترجمته
 * @param targetLanguage - اللغة المستهدفة
 * @returns الترجمة
 * @example
 * const result = await translateText('Hello', 'ar');
 */
export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  // ...
}
```

### تعرية النقاط
```typescript
// 🔴 سيء
const x = 5;

// 🟢 جيد
const maxParticipants = 50;
const roomDurationSeconds = parseFloat(duration);
```

### التعليقات
```typescript
// استخدم التعليقات بشكل معقول
// ✅ اشرح "لماذا" وليس "ماذا"

// حرج: نسخ المشاركين قبل التحديث لتجنب mutations
const updatedParticipants = [...participants, newParticipant];
```

---

## الموارد

### التعليم
- [Next.js Docs](https://nextjs.org)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### أدوات
- [Prettier](https://prettier.io) - صيغة الكود
- [ESLint](https://eslint.org) - جودة الكود
- [Husky](https://typicode.github.io/husky/) - Pre-commit hooks

### المجتمع
- GitHub Issues
- Discord community
- Weekly standup meetings

---

## الدعم

**الأسئلة الشائعة:**
- 📖 اقرأ الوثيقة أولاً
- 🔍 ابحث في المشاكل المغلقة
- 💬 اسأل في Slack
- 📞 اجتماع مباشر أسبوعي

**الإبلاغ عن الأخطاء:**
```
1. تجميع معلومات خطأ
2. إعادة إنتاج المشكلة
3. فتح issue مع التفاصيل
4. إضافة لقطات الشاشة/الفيديو
```

---

**آخر تحديث: 22 فبراير 2026**
**الإصدار: 1.0.0**
