-- إنشاء جداول إضافية مطلوبة للنظام وتحسين الموجود

-- جدول أنواع الخدمات
CREATE TABLE IF NOT EXISTS public.service_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الأقسام
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعدادات النظام
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول سجل النشاطات المحسن
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_repositories_manager_id ON public.repositories(manager_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);

-- تفعيل RLS للجداول الجديدة
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للجداول الجديدة
CREATE POLICY "جميع المستخدمين يمكنهم رؤية أنواع الخدمات" 
ON public.service_types FOR SELECT USING (true);

CREATE POLICY "المديرون يمكنهم إدارة أنواع الخدمات" 
ON public.service_types FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'manager')
));

CREATE POLICY "جميع المستخدمين يمكنهم رؤية الأقسام" 
ON public.departments FOR SELECT USING (true);

CREATE POLICY "المديرون يمكنهم إدارة الأقسام" 
ON public.departments FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'manager')
));

CREATE POLICY "المديرون يمكنهم رؤية إعدادات النظام" 
ON public.system_settings FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'manager')
));

CREATE POLICY "المديرون يمكنهم تحديث إعدادات النظام" 
ON public.system_settings FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'manager')
));

CREATE POLICY "المديرون يمكنهم رؤية سجل النظام" 
ON public.system_logs FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'manager')
));

CREATE POLICY "النظام يمكنه إدراج سجلات" 
ON public.system_logs FOR INSERT 
WITH CHECK (true);

-- إضافة مشغلات التحديث التلقائي
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة المشغلات للجداول
CREATE TRIGGER update_service_types_updated_at
    BEFORE UPDATE ON public.service_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- إدراج بيانات أساسية
INSERT INTO public.service_types (name, description) VALUES 
('صيانة كهربائية', 'خدمات الصيانة الكهربائية'),
('صيانة ميكانيكية', 'خدمات الصيانة الميكانيكية'),
('تنظيف', 'خدمات التنظيف العامة'),
('أمن وحراسة', 'خدمات الأمن والحراسة')
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (name, description) VALUES 
('تقنية المعلومات', 'قسم تقنية المعلومات'),
('الصيانة', 'قسم الصيانة العامة'),
('الموارد البشرية', 'قسم الموارد البشرية'),
('المالية', 'القسم المالي')
ON CONFLICT DO NOTHING;

-- إعدادات النظام الأساسية
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES 
('app_name', '{"value": "نظام إدارة الذكاء الاصطناعي"}', 'اسم التطبيق'),
('max_file_size', '{"value": 10485760}', 'الحد الأقصى لحجم الملف بالبايت'),
('supported_languages', '{"value": ["ar", "en"]}', 'اللغات المدعومة'),
('ai_models_enabled', '{"value": ["deepseek", "claude", "azure-openai"]}', 'نماذج الذكاء الاصطناعي المفعلة'),
('backup_frequency', '{"value": "weekly"}', 'تكرار النسخ الاحتياطية'),
('notification_settings', '{"email": true, "push": false}', 'إعدادات الإشعارات')
ON CONFLICT (setting_key) DO NOTHING;