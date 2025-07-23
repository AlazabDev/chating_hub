-- إنشاء جداول لذاكرة السياق والذكاء الاصطناعي

-- جدول محادثات الذكاء الاصطناعي
CREATE TABLE public.ai_conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'deepseek',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول رسائل المحادثات
CREATE TABLE public.ai_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول اقتراحات الكود
CREATE TABLE public.code_suggestions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    repository_id UUID REFERENCES public.repositories(id),
    file_path TEXT NOT NULL,
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('improvement', 'bug_fix', 'optimization', 'security')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    code_snippet TEXT,
    suggested_fix TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
    created_by_ai BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول تحليل الكود
CREATE TABLE public.code_analysis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    repository_id UUID REFERENCES public.repositories(id),
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('full_scan', 'incremental', 'security_scan')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    results JSONB DEFAULT '{}',
    issues_found INTEGER DEFAULT 0,
    suggestions_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- تمكين RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_analysis ENABLE ROW LEVEL SECURITY;

-- سياسات أمان المحادثات
CREATE POLICY "المستخدمون يمكنهم رؤية محادثاتهم" 
ON public.ai_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إنشاء محادثات" 
ON public.ai_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث محادثاتهم" 
ON public.ai_conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- سياسات أمان الرسائل
CREATE POLICY "المستخدمون يمكنهم رؤية رسائل محادثاتهم" 
ON public.ai_messages 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.ai_conversations 
    WHERE id = ai_messages.conversation_id 
    AND user_id = auth.uid()
));

CREATE POLICY "المستخدمون يمكنهم إضافة رسائل لمحادثاتهم" 
ON public.ai_messages 
FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.ai_conversations 
    WHERE id = ai_messages.conversation_id 
    AND user_id = auth.uid()
));

-- سياسات أمان اقتراحات الكود
CREATE POLICY "المستخدمون يمكنهم رؤية جميع الاقتراحات" 
ON public.code_suggestions 
FOR SELECT 
USING (true);

CREATE POLICY "المديرون يمكنهم إدارة اقتراحات مستودعاتهم" 
ON public.code_suggestions 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.repositories 
    WHERE id = code_suggestions.repository_id 
    AND manager_id = auth.uid()
));

-- سياسات أمان تحليل الكود
CREATE POLICY "المستخدمون يمكنهم رؤية جميع تحاليل الكود" 
ON public.code_analysis 
FOR SELECT 
USING (true);

CREATE POLICY "المديرون يمكنهم إدارة تحاليل مستودعاتهم" 
ON public.code_analysis 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.repositories 
    WHERE id = code_analysis.repository_id 
    AND manager_id = auth.uid()
));

-- تريغر تحديث الوقت
CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_code_suggestions_updated_at
BEFORE UPDATE ON public.code_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();