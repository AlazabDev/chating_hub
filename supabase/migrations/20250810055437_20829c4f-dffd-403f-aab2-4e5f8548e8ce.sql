-- إنشاء جدول المصادقة والمستخدمين
-- سياسات RLS للمصادقة
CREATE POLICY "Users can view their own profile" ON auth.users FOR SELECT USING (auth.uid() = id);

-- تحديث جدول profiles لإدارة المستخدمين بشكل أفضل
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- إنشاء جدول لملفات المشروع
CREATE TABLE IF NOT EXISTS project_code_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'text',
  size_bytes BIGINT DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_code_files ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لملفات المشروع
CREATE POLICY "Users can manage their own code files" 
ON project_code_files 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Public files are viewable by everyone" 
ON project_code_files 
FOR SELECT 
USING (is_public = true);

-- إنشاء فهارس للأداء
CREATE INDEX idx_project_code_files_user_id ON project_code_files(user_id);
CREATE INDEX idx_project_code_files_project_id ON project_code_files(project_id);
CREATE INDEX idx_project_code_files_file_path ON project_code_files(file_path);

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_project_code_files_updated_at
BEFORE UPDATE ON project_code_files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- إضافة دعم لحقل username في profiles
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username) WHERE username IS NOT NULL;