-- إضافة RLS policies للجداول المفقودة

-- جدول activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم رؤية سجل النشاط" 
ON public.activity_log 
FOR SELECT 
USING (true);

CREATE POLICY "المستخدمون المعتمدون يمكنهم إدراج سجل النشاط" 
ON public.activity_log 
FOR INSERT 
WITH CHECK (auth.uid() = performed_by);

-- جدول assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم رؤية مهامهم" 
ON public.assignments 
FOR SELECT 
USING (auth.uid() = assigned_to OR auth.uid() = assigned_by);

CREATE POLICY "المستخدمون يمكنهم إنشاء مهام" 
ON public.assignments 
FOR INSERT 
WITH CHECK (auth.uid() = assigned_by);

-- جدول attachments
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم رؤية مرفقاتهم" 
ON public.attachments 
FOR SELECT 
USING (auth.uid() = uploaded_by);

CREATE POLICY "المستخدمون يمكنهم رفع مرفقات" 
ON public.attachments 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

-- جدول maintenance_works
ALTER TABLE public.maintenance_works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الفنيون يمكنهم رؤية أعمالهم" 
ON public.maintenance_works 
FOR SELECT 
USING (auth.uid() = technician_id);

CREATE POLICY "الفنيون يمكنهم إدراج أعمال" 
ON public.maintenance_works 
FOR INSERT 
WITH CHECK (auth.uid() = technician_id);

-- جدول project_files
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم رؤية ملفات المشاريع" 
ON public.project_files 
FOR SELECT 
USING (true);

CREATE POLICY "المستخدمون يمكنهم رفع ملفات المشاريع" 
ON public.project_files 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

-- جدول project_photos
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم رؤية صور المشاريع" 
ON public.project_photos 
FOR SELECT 
USING (true);

CREATE POLICY "المستخدمون يمكنهم رفع صور المشاريع" 
ON public.project_photos 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

-- جدول project_progress
ALTER TABLE public.project_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم رؤية تقدم المشاريع" 
ON public.project_progress 
FOR SELECT 
USING (true);

CREATE POLICY "المستخدمون يمكنهم تسجيل تقدم المشاريع" 
ON public.project_progress 
FOR INSERT 
WITH CHECK (auth.uid() = recorded_by);

-- جدول project_tasks
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم رؤية جميع مهام المشاريع" 
ON public.project_tasks 
FOR SELECT 
USING (true);

CREATE POLICY "المستخدمون يمكنهم إنشاء مهام المشاريع" 
ON public.project_tasks 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id AND manager_id = auth.uid()
  )
);

-- جدول ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم رؤية التقييمات" 
ON public.ratings 
FOR SELECT 
USING (true);

CREATE POLICY "المستخدمون يمكنهم إضافة تقييمات" 
ON public.ratings 
FOR INSERT 
WITH CHECK (auth.uid() = rated_by);

-- جدول request_status_log
ALTER TABLE public.request_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم رؤية سجل حالة الطلبات" 
ON public.request_status_log 
FOR SELECT 
USING (true);

CREATE POLICY "المستخدمون يمكنهم إدراج سجل حالة الطلبات" 
ON public.request_status_log 
FOR INSERT 
WITH CHECK (auth.uid() = changed_by);

-- إصلاح وظائف الأمان بإضافة search_path آمن
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.schedule_user_backup(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.backup_jobs (user_id, backup_type, scheduled_at)
  VALUES (
    user_uuid,
    'weekly_chat',
    (CURRENT_TIMESTAMP + INTERVAL '7 days')::timestamp with time zone
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.setup_user_backup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.schedule_user_backup(NEW.id);
  RETURN NEW;
END;
$$;