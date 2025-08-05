-- إنشاء جدول مفاتيح API والتكاملات
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'deepseek', 'stripe', etc.
  key_name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL, -- المفتاح مشفر
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  last_used TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider, key_name)
);

-- جدول إعدادات التكاملات
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL, -- 'ai_model', 'payment', 'storage', etc.
  provider TEXT NOT NULL, -- 'openai', 'stripe', 'google_drive', etc.
  configuration JSONB NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, integration_type, provider)
);

-- جدول سجل استخدام API
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  endpoint TEXT,
  request_count INTEGER DEFAULT 1,
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_api_keys_user_provider ON public.api_keys(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_integrations_user_type ON public.integrations(user_id, integration_type);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_created ON public.api_usage_logs(user_id, created_at);

-- تفعيل RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- سياسات RLS
CREATE POLICY "المستخدمون يمكنهم إدارة مفاتيحهم" 
ON public.api_keys FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إدارة تكاملاتهم" 
ON public.integrations FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم رؤية سجل استخدامهم" 
ON public.api_usage_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "النظام يمكنه إدراج سجل الاستخدام" 
ON public.api_usage_logs FOR INSERT 
WITH CHECK (true);

-- إضافة مشغلات التحديث
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON public.integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- دالة لتشفير المفاتيح (بسيطة - للاستخدام الأساسي)
CREATE OR REPLACE FUNCTION public.encrypt_api_key(key_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- تشفير بسيط باستخدام encode - في الإنتاج يُفضل استخدام تشفير أقوى
  RETURN encode(key_value::bytea, 'base64');
END;
$$;

-- دالة لفك تشفير المفاتيح
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN convert_from(decode(encrypted_key, 'base64'), 'UTF8');
END;
$$;