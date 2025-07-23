# DeepSec Pilot - مساعد الذكاء الاصطناعي للتطوير

🚀 **نظام متقدم لإدارة المشاريع والتطوير بدعم الذكاء الاصطناعي**

## نظرة عامة

DeepSec Pilot هو تطبيق ويب متقدم يوفر بيئة شاملة لإدارة المشاريع البرمجية والتطوير مع دعم الذكاء الاصطناعي. يتميز التطبيق بواجهة حديثة وأدوات قوية للمطورين ومديري المشاريع.

## الميزات الرئيسية

### 🤖 الذكاء الاصطناعي
- دعم متعدد للنماذج: DeepSeek و Azure OpenAI
- محادثة ذكية مع السياق
- اقتراحات الكود التلقائية
- تحليل وتحسين الكود

### 📁 إدارة المستودعات
- إدارة مستودعات Frappe متعددة
- تتبع العمليات والتبعيات
- مزامنة Git تلقائية
- تحليل الكود المستمر

### 📊 مراقبة الأداء
- مراقبة الأداء الحي
- تحليل استخدام الموارد
- تقارير مفصلة
- تنبيهات ذكية

### 🎨 واجهة متقدمة
- تصميم بسيط وطبيعي
- دعم الوضع الليلي والنهاري
- دعم متعدد اللغات (العربية والإنجليزية)
- تجربة مستخدم محسنة

## التقنيات المستخدمة

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Edge Functions)
- **UI Components:** Radix UI, Lucide Icons
- **Styling:** Tailwind CSS مع نظام ألوان طبيعية
- **Build Tool:** Vite
- **State Management:** React Hooks

## التثبيت والإعداد

### متطلبات النظام
- Node.js 18+ 
- npm أو yarn
- حساب Supabase

### خطوات التثبيت

```sh
# 1. استنساخ المشروع
git clone <YOUR_GIT_URL>

# 2. الانتقال للمجلد
cd <YOUR_PROJECT_NAME>

# 3. تثبيت التبعيات
npm install

# 4. تشغيل التطبيق
npm run dev
```

## الإعداد والتكوين

### إعداد الذكاء الاصطناعي

1. **DeepSeek API**
   - احصل على API Key من [DeepSeek Platform](https://platform.deepseek.com)
   - أدخل المفتاح في إعدادات التطبيق

2. **Azure OpenAI**
   - إنشاء مورد Azure OpenAI
   - أدخل Endpoint, API Key, و Deployment Name

### الأمان والحماية

- جميع البيانات محمية بـ Row Level Security (RLS)
- كل مستخدم يصل فقط لبياناته
- API Keys محفوظة بشكل آمن في Supabase Secrets
- تشفير البيانات في النقل والتخزين

## النشر

### نشر مع Lovable
افتح [Lovable](https://lovable.dev/projects/d4a15231-9530-4fea-841c-726b8986a1da) واضغط Share → Publish

### ربط نطاق مخصص
انتقل إلى Project > Settings > Domains واضغط Connect Domain

## الدعم والمساعدة

- **التطوير المحلي:** استخدم `npm run dev`
- **المشاكل:** استخدم GitHub Issues
- **التوثيق:** راجع [دليل Lovable](https://docs.lovable.dev)

## الترخيص

مشروع مفتوح المصدر - راجع ملف LICENSE للتفاصيل

---

🌟 **للحصول على أفضل تجربة، تأكد من تكوين API keys في الإعدادات**
