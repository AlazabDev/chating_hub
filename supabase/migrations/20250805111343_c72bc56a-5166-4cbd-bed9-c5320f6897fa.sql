-- إصلاح مشاكل الأمان - تحديد search_path للدوال

-- تحديث دالة التحديث التلقائي لتشمل search_path آمن
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- تحديث دالة handle_new_user مع search_path آمن
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
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

-- تحديث دالة schedule_user_backup مع search_path آمن
CREATE OR REPLACE FUNCTION public.schedule_user_backup(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- تحديث دالة setup_user_backup مع search_path آمن
CREATE OR REPLACE FUNCTION public.setup_user_backup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM public.schedule_user_backup(NEW.id);
  RETURN NEW;
END;
$$;