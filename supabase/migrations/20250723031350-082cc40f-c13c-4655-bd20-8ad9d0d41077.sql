-- إنشاء جداول إدارة المستودعات المتعددة لمشاريع Frappe

-- جدول المستودعات
CREATE TABLE public.repositories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    frappe_type TEXT NOT NULL CHECK (frappe_type IN ('erpnext', 'hrms', 'crm', 'helpdesk', 'custom')),
    git_url TEXT,
    local_path TEXT,
    branch TEXT DEFAULT 'main',
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'syncing')),
    manager_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_sync TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}'::jsonb
);

-- جدول العمليات على المستودعات
CREATE TABLE public.repository_operations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    repository_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('clone', 'pull', 'push', 'build', 'deploy', 'install', 'migrate')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    initiated_by UUID REFERENCES auth.users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    logs TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    result JSONB DEFAULT '{}'::jsonb
);

-- جدول تبعيات المستودعات
CREATE TABLE public.repository_dependencies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    repository_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE,
    dependency_name TEXT NOT NULL,
    dependency_version TEXT,
    dependency_type TEXT NOT NULL CHECK (dependency_type IN ('python', 'node', 'system', 'frappe_app')),
    is_required BOOLEAN DEFAULT true,
    installed_version TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'installed', 'outdated', 'missing', 'error'))
);

-- تمكين RLS
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_dependencies ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمستودعات
CREATE POLICY "المستخدمون يمكنهم رؤية جميع المستودعات"
ON public.repositories FOR SELECT
USING (true);

CREATE POLICY "المديرون يمكنهم إنشاء المستودعات"
ON public.repositories FOR INSERT
WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "المديرون يمكنهم تحديث مستودعاتهم"
ON public.repositories FOR UPDATE
USING (auth.uid() = manager_id);

-- سياسات الأمان للعمليات
CREATE POLICY "المستخدمون يمكنهم رؤية جميع العمليات"
ON public.repository_operations FOR SELECT
USING (true);

CREATE POLICY "المستخدمون يمكنهم إنشاء العمليات"
ON public.repository_operations FOR INSERT
WITH CHECK (auth.uid() = initiated_by);

-- سياسات الأمان للتبعيات
CREATE POLICY "المستخدمون يمكنهم رؤية جميع التبعيات"
ON public.repository_dependencies FOR SELECT
USING (true);

CREATE POLICY "المديرون يمكنهم إدارة تبعيات مستودعاتهم"
ON public.repository_dependencies FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.repositories r 
        WHERE r.id = repository_id AND r.manager_id = auth.uid()
    )
);

-- دالة تحديث التاريخ
CREATE TRIGGER update_repositories_updated_at
    BEFORE UPDATE ON public.repositories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- إدراج بيانات تجريبية لمشاريع Frappe الـ30
INSERT INTO public.repositories (name, description, frappe_type, git_url, manager_id, status) VALUES
('ERPNext Production', 'نظام تخطيط موارد المؤسسة الرئيسي', 'erpnext', 'https://github.com/frappe/erpnext.git', (SELECT id FROM auth.users LIMIT 1), 'active'),
('HRMS System', 'نظام إدارة الموارد البشرية', 'hrms', 'https://github.com/frappe/hrms.git', (SELECT id FROM auth.users LIMIT 1), 'active'),
('CRM Platform', 'منصة إدارة علاقات العملاء', 'crm', 'https://github.com/frappe/crm.git', (SELECT id FROM auth.users LIMIT 1), 'inactive'),
('HelpDesk System', 'نظام دعم العملاء', 'helpdesk', 'https://github.com/frappe/helpdesk.git', (SELECT id FROM auth.users LIMIT 1), 'inactive'),
('Construction Management', 'نظام إدارة المشاريع الإنشائية المخصص', 'custom', 'https://github.com/company/construction-erp.git', (SELECT id FROM auth.users LIMIT 1), 'active');