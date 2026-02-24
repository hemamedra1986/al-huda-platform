# Firebase Hosting - دليل النشر الكامل

## ✅ الخطوات قبل النشر

### 1. تثبيت Firebase CLI (إن لم تقم بذلك)

```bash
# الطريقة الأولى
npm install -g firebase-tools

# الطريقة الثانية (إذا فشلت الأولى)
npx firebase-tools init
```

### 2. تسجيل الدخول

```bash
firebase login
```

ستفتح صفحة في المتصفح تطلب تسجيل الدخول بحسابك على Google.

### 3. ربط المشروع بـ Firebase Project

```bash
firebase init
```

ستُسأل:
- أي ميزات تريد إعداد؟ → اختر **Hosting**
- اختر **al-huda-platform** من القائمة
- Public directory: اترك الافتراضي أو أدخل `.next`
- Configure as a single-page app? → اكتب **y** (نعم)

### 4. بناء المشروع

```bash
npm run build
```

هذا سينشئ مجلد `.next` مع جميع الملفات الثابتة المجمعة.

### 5. نشر على Firebase Hosting

```bash
firebase deploy --only hosting
```

أو للنشر من جميع الخدمات:

```bash
firebase deploy
```

---

## 🎯 يمكنك أيضاً نشر من GitHub تلقائياً

### إعداد الربط التلقائي

```bash
firebase hosting:channel:deploy main --expires 26d
```

---

## 📊 الملفات المطلوبة (موجودة الآن!)

✅ `.firebaserc` - معرّف المشروع
✅ `firebase.json` - إعدادات Hosting
✅ `.gitignore` - ملفات Firebase محفوظة
✅ `.env.local` - متغيرات البيئة (محفوظة بالفعل)

---

## 🚀 الأوامر الأساسية

| الأمر | الوصف |
|------|-------|
| `firebase login` | تسجيل الدخول |
| `firebase logout` | تسجيل الخروج |
| `firebase init` | إعداد مشروع جديد |
| `npm run build` | بناء المشروع |
| `firebase deploy` | نشر جميع الخدمات |
| `firebase deploy --only hosting` | نشر Hosting فقط |
| `firebase hosting:disable` | إيقاف الـ Hosting |

---

## 📱 الرابط بعد النشر

سيكون الرابط:
```
https://al-huda-platform.web.app
```

أو:
```
https://al-huda-platform.firebaseapp.com
```

---

## ✨ ملاحظات مهمة

### متغيرات البيئة
- متغيرات `NEXT_PUBLIC_*` ستُضمّن في البناء تلقائياً
- متغيرات `STRIPE_SECRET_KEY` و `PAYPAL_CLIENT_SECRET` لن تُرسّل للعميل (محفوظة)

### Production Rules
قبل النشر، قم بنشر Firestore و Storage Rules:

```bash
firebase deploy --only firestore:rules,storage
```

### التحقق من النشر

```bash
firebase hosting:list
firebase deploy --only hosting --message "v1.0"
```

---

## 🔧 المشاكل الشائعة وحلولها

### مشكلة: "Project not found"
```bash
firebase use al-huda-platform
firebase deploy
```

### مشكلة: "Permission denied"
تأكد من تسجيل الدخول:
```bash
firebase logout
firebase login
```

### مشكلة: الصفحات لا تحمّل بشكل صحيح
تأكد من:
- ✅ `firebase.json` موجود
- ✅ `.next` folder تم بناؤه (`npm run build`)
- ✅ Rewrites rules صحيح

---

**الآن جاهز للنشر! 🚀**
