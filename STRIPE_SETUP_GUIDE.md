# 🔐 دليل تكامل Stripe - منصة الهُدى

## 📋 المحتويات
1. [إعداد حساب Stripe](#إعداد-حساب-stripe)
2. [الحصول على المفاتيح](#الحصول-على-المفاتيح)
3. [البيئات (Environments)](#البيئات)
4. [اختبار الدفعations](#اختبار-الدفعات)
5. [Webhooks والمعالجات](#webhooks-والمعالجات)
6. [الأمان وأفضل الممارسات](#الأمان-وأفضل-الممارسات)

---

## 🚀 إعداد حساب Stripe

### الخطوة 1: إنشاء حساب
1. اذهب إلى [stripe.com](https://stripe.com)
2. انقر "Start now" (ابدأ الآن)
3. أدخل بريدك الإلكتروني وكلمة المرور
4. اختر النوع: "Individual" أو "Business"
5. أكمل التحقق من هويتك

### الخطوة 2: تفعيل الحساب
1. قم بتسجيل الدخول إلى [dashboard.stripe.com](https://dashboard.stripe.com)
2. اتبع خطوات التحقق:
   - معلومات شخصية/تجارية
   - بيانات بنكية
   - رقم الهاتف
3. انتظر الموافقة (عادة 24-48 ساعة)

---

## 🔑 الحصول على المفاتيح

### المفاتيح المطلوبة

**1. Public Key (Publishable Key)** - للعميل
```
pk_test_... (في المرحلة الاختبارية)
pk_live_... (في الإنتاج)
```

**2. Secret Key** - للخادم فقط
```
sk_test_... (في المرحلة الاختبارية)
sk_live_... (في الإنتاج)
```

**3. Webhook Secret**
```
whsec_... (لمعالجة الأحداث)
```

### كيفية الحصول عليها

#### للمفاتيح:
1. في Dashboard، انقر على اسمك (أعلى يمين)
2. اختر "Developers" ← "API Keys"
3. ستجد:
   - Publishable key (Public)
   - Secret key (سري - احفظه في مكان آمن)

#### لـ Webhook Secret:
1. في نفس صفحة Developers
2. اختر "Webhooks"
3. انقر "+ Add endpoint"
4. أدخل رابط webhook:
   ```
   https://your-domain.com/api/payments/webhook
   ```
5. في البيئة المحلية (localhost):
   ```bash
   # استخدم Stripe CLI بدلاً من الرابط
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```
6. انسخ الـ signing secret الذي تُعطيه لك

---

## 🔐 البيئات (Environments)

### المرحلة الاختبارية (Development)
```bash
# أضف في .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### الإنتاج (Production)
```bash
# أضف في متغيرات البيئة بـ Vercel/Hosting
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🧪 اختبار الدفعات

### بطاقات اختبارية من Stripe

#### بطاقات تجريبية:

**الدفع الناجح:**
```
رقم البطاقة: 4242 4242 4242 4242
الصلاحية:    أي تاريخ في المستقبل (مثل 12/25)
CVC:         أي 3 أرقام (مثل 123)
```

**الدفع الفاشل (declined):**
```
رقم البطاقة: 4000 0000 0000 0002
الصلاحية:    أي تاريخ في المستقبل
CVC:         أي 3 أرقام
```

**بطاقة تتطلب تصديق 3D Secure:**
```
رقم البطاقة: 4000 0025 0000 3155
الصلاحية:    أي تاريخ في المستقبل
CVC:         أي 3 أرقام
```

### خطوات الاختبار:

1. **ابدأ الخادم:**
   ```bash
   npm run dev
   ```

2. **اختبر Webhooks (في terminal منفصل):**
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```
   ستحصل على signing secret - انسخه إلى .env.local

3. **افتح الموقع:**
   ```
   http://localhost:3000/subscriptions
   ```

4. **اختبر عملية الدفع:**
   - اختر خطة
   - أدخل بريدك الإلكتروني
   - أدخل بيانات بطاقة اختبارية
   - انقر "ادفع الآن"
   - تحقق من رسالة النجاح

5. **تابع الأحداث:**
   - في Dashboard → Events، ستجد:
     ```
     payment_intent.created
     payment_intent.succeeded
     ```

---

## 🔗 Webhooks والمعالجات

### أحداث Stripe المدعومة

في `/api/payments/webhook`:

```typescript
// أحداث الدفع
'payment_intent.succeeded'      // الدفع نجح
'payment_intent.payment_failed' // الدفع فشل

// أحداث الاشتراك
'customer.subscription.created'  // اشتراك جديد
'customer.subscription.deleted'  // إلغاء اشتراك
'invoice.payment_succeeded'      // دفع الفاتورة

// يمكنك إضافة المزيد...
```

### معالجات Custom:

كل حدث يستدعي handler خاص:

```typescript
async function handlePaymentIntentSucceeded(paymentIntent) {
  // TODO: تحديث قاعدة البيانات
  // TODO: إرسال بريد تأكيد
  // TODO: تفعيل الاشتراك
}
```

### المعالجات الحالية:

- ✅ `handlePaymentIntentSucceeded` - الدفع نجح
- ✅ `handlePaymentIntentFailed` - الدفع فشل
- ✅ `handleSubscriptionCreated` - اشتراك جديد
- ✅ `handleSubscriptionDeleted` - حذف اشتراك
- ✅ `handleInvoicePaymentSucceeded` - فاتورة دفعت

---

## 🔒 الأمان وأفضل الممارسات

### 1. حماية المفاتيح

**❌ لا تفعل:**
```typescript
// ❌ خطر!
const stripe = new Stripe('sk_test_...');
```

**✅ افعل:**
```typescript
// ✅ آمن
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
```

### 2. تحقق من الـ Webhook Signature

```typescript
// ✅ تحقق دائمًا
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
// يرفع خطأ إذا كانت التوقيع خاطئة
```

### 3. التعامل مع الأخطاء

```typescript
try {
  const paymentIntent = await stripe.paymentIntents.create({...});
} catch (error) {
  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    // معالجة خاصة
  }
  // لا تكشف تفاصيل الخطأ للعميل
}
```

### 4. استخدام Environment Variables

```bash
# .env.local (لا تشاركه)
STRIPE_SECRET_KEY=sk_test_...

# لن يُرسل إلى العميل (Server-only)
```

### 5. التحقق من البيانات

```typescript
if (!amount || !email) {
  return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
}
```

### 6. معدلات السرعة (Rate Limiting)

```typescript
// أضف middleware للتحقق من عدد الطلبات
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100 // 100 طلب
});
```

---

## 📊 مراقبة الدفعات

### في Dashboard:

1. **Payments** - جميع الدفعات
2. **Subscriptions** - الاشتراكات النشطة
3. **Customers** - قائمة العملاء
4. **Events** - السجل الكامل للأحداث
5. **Reports** - تقارير الإيرادات

### API للاستعلام:

```typescript
// الحصول على دفعة معينة
const paymentIntent = await stripe.paymentIntents.retrieve(id);

// قائمة الدفعات
const paymentIntents = await stripe.paymentIntents.list({
  limit: 10
});

// البحث عن عميل
const customer = await stripe.customers.retrieve(customerId);
```

---

## 🐛 استكشاف الأخطاء

### خطأ: "Invalid API Key"
```
✅ تحقق من STRIPE_SECRET_KEY في .env.local
✅ تأكد من أنه sk_test_... و ليس pk_...
```

### خطأ: "Webhook signature verification failed"
```
✅ تحقق من STRIPE_WEBHOOK_SECRET
✅ استخدم `stripe listen` للحصول على الـ secret الصحيح
```

### خطأ: "Payment declined"
```
✅ استخدم بطاقة اختبار صحيحة (4242 4242...)
✅ تحقق من صلاحية البطاقة
✅ تحقق من CVC
```

### خطأ: "CORS error"
```
✅ تأكد من أن public key صحيح (pk_ وليس sk_)
✅ استخدم NEXT_PUBLIC_ prefix
```

---

## ✅ Checklist قبل الإنتاج

- [ ] اختبرت جميع البطاقات التجريبية
- [ ] verified Webhooks تعمل
- [ ] أضفت معالجات للأخطاء
- [ ] حفظت Secret Key بأمان
- [ ] أضفت rate limiting
- [ ] اختبرت في بيئة اختبارية
- [ ] أضفت logs للدفعات
- [ ] أعددت عملية الانتقال للـ live keys
- [ ] اختبرت البريد الإلكتروني
- [ ] أضفت SSL/HTTPS

---

## 🔗 روابط مفيدة

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [API Reference](https://stripe.com/docs/api)

---

## 💡 نصائح إضافية

### Stripe CLI للتطوير المحلي:
```bash
# التثبيت
brew install stripe/stripe-cli/stripe

# تسجيل الدخول
stripe login

# الاستماع للأحداث
stripe listen --forward-to localhost:3000/api/payments/webhook

# اختبر الأحداث
stripe trigger payment_intent.succeeded
```

### Stripe Logs API:
```bash
# عرض السجلات
stripe logs tail

# البحث في السجلات
stripe logs search "error"
```

---

## 📞 الدعم

- Stripe Support: [support@stripe.com](mailto:support@stripe.com)
- Community: [stripe.com/community](https://stripe.com/community)
- Documentation: [stripe.com/docs](https://stripe.com/docs)

---

**آخر تحديث: 22 فبراير 2026**
