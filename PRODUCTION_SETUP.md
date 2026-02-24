# دليل تشغيل الموقع على الإنتاج

## الخطوة 1: ملء متغيرات البيئة
أكمل ملء القيم في `.env.local` بـ مفاتيحك الحقيقية:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...         # من Firebase Console
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...      # YOUR_PROJECT.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...       # معرّف مشروعك
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...   # YOUR_PROJECT.appspot.com

# Stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_...      # من Stripe Dashboard
STRIPE_SECRET_KEY=sk_...                  # مفتاح سري من Stripe

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...          # من PayPal Developer

# Admin Emails
NEXT_PUBLIC_ADMIN_EMAILS=admin@alhuda.com,owner@alhuda.com
```

## الخطوة 2: نشر Firestore Rules
```bash
# قم بتثبيت Firebase CLI أولاً (إن لم تقم بذلك)
npm install -g firebase-tools

# تسجيل الدخول لحسابك
firebase login

# اختيار المشروع
firebase use YOUR_PROJECT_ID

# نشر القواعد
firebase deploy --only firestore:rules
```

## الخطوة 3: تشغيل الموقع محليًا
```bash
npm run dev
# سيكون متاح على http://localhost:3000
```

## الخطوة 4: الإنتاج (Production)
```bash
npm run build
npm run start
```

## المسارات الرئيسية:
- `/login` - تسجيل الدخول
- `/profile` - ملف المستخدم الشخصي
- `/consultations` - طلب استشارة
- `/messages` - الدردشة مع الأدمن
- `/subscriptions` - الاشتراكات والدفع
- `/admin` - لوحة التحكم (لإيميلات الأدمن فقط)
- `/admin/messages` - إدارة الرسائل
- `/admin/firestore` - عرض Firestore Collections

## متطلبات Firebase:
- تفعيل Firebase Authentication (Google + Email/Password)
- إنشاء Firestore Database
- إنشاء Firebase Storage للملفات الصوتية
- نشر firestore.rules

## متطلبات الدفع:
- حساب Stripe مع API Keys
- حساب PayPal مع Client ID

---

**شغّال الآن على:** http://localhost:3000 ✅
