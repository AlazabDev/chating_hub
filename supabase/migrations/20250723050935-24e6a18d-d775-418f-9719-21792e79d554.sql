-- إنشاء جدول المرفقات للدردشة
CREATE TABLE public.chat_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.ai_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول للمرفقات
CREATE POLICY "المستخدمون يمكنهم رؤية مرفقات محادثاتهم"
ON public.chat_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE ai_conversations.id = chat_attachments.conversation_id
    AND ai_conversations.user_id = auth.uid()
  )
);

CREATE POLICY "المستخدمون يمكنهم إضافة مرفقات لمحادثاتهم"
ON public.chat_attachments FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE ai_conversations.id = chat_attachments.conversation_id
    AND ai_conversations.user_id = auth.uid()
  )
);

-- إنشاء جدول النسخ الاحتياطية
CREATE TABLE public.backup_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  backup_type TEXT NOT NULL DEFAULT 'weekly_chat',
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  file_url TEXT,
  drive_file_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS
ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول للنسخ الاحتياطية
CREATE POLICY "المستخدمون يمكنهم رؤية نسخهم الاحتياطية"
ON public.backup_jobs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "النظام يمكنه إنشاء النسخ الاحتياطية"
ON public.backup_jobs FOR INSERT
WITH CHECK (true);

CREATE POLICY "النظام يمكنه تحديث النسخ الاحتياطية"
ON public.backup_jobs FOR UPDATE
USING (true);

-- إنشاء bucket للمرفقات
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', false);

-- سياسات التخزين للمرفقات
CREATE POLICY "المستخدمون يمكنهم رؤية مرفقاتهم"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "المستخدمون يمكنهم رفع مرفقاتهم"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- إنشاء bucket للنسخ الاحتياطية
INSERT INTO storage.buckets (id, name, public) VALUES ('backups', 'backups', false);

-- سياسات التخزين للنسخ الاحتياطية
CREATE POLICY "المستخدمون يمكنهم رؤية نسخهم الاحتياطية"
ON storage.objects FOR SELECT
USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "النظام يمكنه إنشاء النسخ الاحتياطية"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'backups');

-- إضافة عمود المرفقات إلى جدول الرسائل
ALTER TABLE public.ai_messages ADD COLUMN attachments JSONB DEFAULT '[]';

-- دالة لجدولة النسخ الاحتياطية التلقائية
CREATE OR REPLACE FUNCTION public.schedule_user_backup(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.backup_jobs (user_id, backup_type, scheduled_at)
  VALUES (
    user_uuid,
    'weekly_chat',
    (CURRENT_TIMESTAMP + INTERVAL '7 days')::timestamp with time zone
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لجدولة النسخة الاحتياطية عند إنشاء مستخدم جديد
CREATE OR REPLACE FUNCTION public.setup_user_backup()
RETURNS TRIGGER AS $$
BEGIN
  -- جدولة أول نسخة احتياطية بعد أسبوع من التسجيل
  PERFORM public.schedule_user_backup(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لجدولة النسخ الاحتياطية للمستخدمين الجدد
CREATE TRIGGER setup_user_backup_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.setup_user_backup();