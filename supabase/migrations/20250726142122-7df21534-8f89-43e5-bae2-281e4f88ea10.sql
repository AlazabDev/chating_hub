-- إصلاح المشكلة وإنشاء جداول AI Platform
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  model_type TEXT NOT NULL DEFAULT 'deepseek',
  context_mode TEXT DEFAULT 'simple',
  repository_id UUID REFERENCES public.repositories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  model_used TEXT,
  context_data JSONB,
  attachments JSONB DEFAULT '[]'::jsonb,
  code_suggestions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_workflow_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repository_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  description TEXT,
  ai_prompt_template TEXT,
  expected_output TEXT,
  is_automated BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تحديث جدول repositories لإضافة المزيد من الخصائص
ALTER TABLE public.repositories 
ADD COLUMN IF NOT EXISTS ai_features_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_suggestions BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS workflow_automation BOOLEAN DEFAULT false;

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_stages_repository_id ON public.ai_workflow_stages(repository_id);

-- تمكين RLS على الجداول الجديدة
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workflow_stages ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمحادثات
CREATE POLICY "Users can view their own conversations" ON public.ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON public.ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.ai_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON public.ai_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- سياسات الأمان للرسائل
CREATE POLICY "Users can view messages in their conversations" ON public.ai_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations 
      WHERE id = ai_messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON public.ai_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations 
      WHERE id = ai_messages.conversation_id AND user_id = auth.uid()
    )
  );

-- سياسات الأمان لمراحل الـ workflow
CREATE POLICY "Users can manage workflow stages for their repositories" ON public.ai_workflow_stages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.repositories 
      WHERE id = ai_workflow_stages.repository_id AND manager_id = auth.uid()
    )
  );

-- triggers للتحديث التلقائي للوقت
CREATE OR REPLACE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- إضافة بيانات تجريبية لمراحل العمل
INSERT INTO public.ai_workflow_stages (repository_id, stage_name, stage_order, description, ai_prompt_template, is_automated) 
SELECT 
  r.id,
  stage_data.name,
  stage_data.order_num,
  stage_data.description_text,
  stage_data.prompt,
  stage_data.automated
FROM public.repositories r,
(VALUES 
  ('تحليل المتطلبات', 1, 'تحليل وفهم متطلبات المشروع', 'قم بتحليل المتطلبات التالية وقدم خطة تطوير مفصلة:', false),
  ('تصميم قاعدة البيانات', 2, 'تصميم هيكل قاعدة البيانات', 'صمم ERD وجداول قاعدة البيانات للمتطلبات التالية:', true),
  ('تطوير API', 3, 'تطوير واجهات برمجة التطبيقات', 'اكتب APIs للوظائف التالية مع Frappe Framework:', true),
  ('اختبار الوحدة', 4, 'كتابة واختبار الوحدات', 'اكتب اختبارات شاملة للكود التالي:', true),
  ('مراجعة الكود', 5, 'مراجعة وتحسين الكود', 'راجع الكود التالي وقدم اقتراحات للتحسين:', false),
  ('النشر', 6, 'نشر التطبيق للإنتاج', 'أعد خطة نشر شاملة للمشروع التالي:', false)
) AS stage_data(name, order_num, description_text, prompt, automated)
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_workflow_stages 
  WHERE repository_id = r.id AND stage_name = stage_data.name
);