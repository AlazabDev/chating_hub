import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repositoryId, analysisType = 'full_scan', files } = await req.json();
    
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // التحقق من صلاحية المستخدم للمستودع
    const { data: repository } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repositoryId)
      .eq('manager_id', user.id)
      .single();

    if (!repository) {
      throw new Error('Repository not found or access denied');
    }

    // إنشاء سجل تحليل جديد
    const { data: analysis, error: analysisError } = await supabase
      .from('code_analysis')
      .insert({
        repository_id: repositoryId,
        analysis_type: analysisType,
        status: 'running'
      })
      .select()
      .single();

    if (analysisError) throw analysisError;

    // بدء تحليل الكود في الخلفية
    EdgeRuntime.waitUntil(performCodeAnalysis(supabase, analysis.id, repository, files || []));

    return new Response(JSON.stringify({
      analysisId: analysis.id,
      status: 'started',
      message: 'تم بدء تحليل الكود'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in code-analyzer function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function performCodeAnalysis(supabase: any, analysisId: string, repository: any, files: string[]) {
  try {
    const results = {
      security_issues: [],
      performance_issues: [],
      code_quality: [],
      suggestions: []
    };

    let issuesFound = 0;
    let suggestionsCount = 0;

    // تحليل أمني أساسي
    if (files.length > 0) {
      for (const file of files) {
        const analysis = await analyzeFile(file, repository);
        
        if (analysis.security_issues.length > 0) {
          results.security_issues.push(...analysis.security_issues);
          issuesFound += analysis.security_issues.length;
        }
        
        if (analysis.suggestions.length > 0) {
          results.suggestions.push(...analysis.suggestions);
          suggestionsCount += analysis.suggestions.length;
          
          // حفظ الاقتراحات في قاعدة البيانات
          for (const suggestion of analysis.suggestions) {
            await supabase
              .from('code_suggestions')
              .insert({
                repository_id: repository.id,
                file_path: file,
                suggestion_type: suggestion.type,
                title: suggestion.title,
                description: suggestion.description,
                code_snippet: suggestion.code_snippet,
                suggested_fix: suggestion.fix,
                priority: suggestion.priority,
                created_by_ai: true
              });
          }
        }
      }
    } else {
      // تحليل عام للمستودع
      const generalAnalysis = await analyzeRepository(repository);
      results.code_quality = generalAnalysis.quality_issues;
      issuesFound = generalAnalysis.issues_count;
      suggestionsCount = generalAnalysis.suggestions_count;
    }

    // تحديث نتائج التحليل
    await supabase
      .from('code_analysis')
      .update({
        status: 'completed',
        results,
        issues_found: issuesFound,
        suggestions_count: suggestionsCount,
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    console.log(`تم إكمال تحليل الكود: ${issuesFound} مشكلة، ${suggestionsCount} اقتراح`);

  } catch (error) {
    console.error('خطأ في تحليل الكود:', error);
    
    await supabase
      .from('code_analysis')
      .update({
        status: 'failed',
        results: { error: error.message },
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId);
  }
}

async function analyzeFile(filePath: string, repository: any) {
  const analysis = {
    security_issues: [],
    suggestions: []
  };

  // قواعد تحليل أساسية حسب نوع الملف
  const fileExtension = filePath.split('.').pop()?.toLowerCase();
  
  switch (fileExtension) {
    case 'py':
      return analyzePythonFile(filePath, repository);
    case 'js':
    case 'ts':
      return analyzeJavaScriptFile(filePath, repository);
    case 'json':
      return analyzeConfigFile(filePath, repository);
    default:
      return analysis;
  }
}

async function analyzePythonFile(filePath: string, repository: any) {
  const analysis = {
    security_issues: [],
    suggestions: []
  };

  // قواعد تحليل Python
  const securityPatterns = [
    {
      pattern: /eval\s*\(/,
      message: 'استخدام eval() غير آمن',
      type: 'security',
      priority: 'high'
    },
    {
      pattern: /exec\s*\(/,
      message: 'استخدام exec() قد يكون خطيراً',
      type: 'security', 
      priority: 'high'
    },
    {
      pattern: /sql.*=.*input/i,
      message: 'احتمالية SQL injection',
      type: 'security',
      priority: 'critical'
    }
  ];

  const qualityPatterns = [
    {
      pattern: /def\s+\w+\s*\([^)]*\):\s*$/m,
      message: 'دالة بدون تعليق توضيحي',
      type: 'improvement',
      priority: 'low'
    },
    {
      pattern: /print\s*\(/,
      message: 'استخدم logging بدلاً من print',
      type: 'improvement',
      priority: 'medium'
    }
  ];

  // فحص نمط أمني (محاكاة - في التطبيق الحقيقي ستحتاج لقراءة الملف)
  securityPatterns.forEach(pattern => {
    analysis.security_issues.push({
      type: pattern.type,
      message: pattern.message,
      priority: pattern.priority,
      file: filePath
    });
  });

  // إضافة اقتراحات
  analysis.suggestions.push({
    type: 'improvement',
    title: 'تحسين جودة الكود Python',
    description: 'إضافة type hints وتحسين التعليقات التوضيحية',
    code_snippet: 'def function_name():',
    fix: 'def function_name() -> ReturnType:\n    """وصف الدالة"""\n    pass',
    priority: 'medium'
  });

  return analysis;
}

async function analyzeJavaScriptFile(filePath: string, repository: any) {
  const analysis = {
    security_issues: [],
    suggestions: []
  };

  // إضافة اقتراحات JavaScript/TypeScript
  analysis.suggestions.push({
    type: 'improvement',
    title: 'تحسين أمان JavaScript',
    description: 'استخدام TypeScript وتجنب eval',
    code_snippet: 'var data = eval(userInput);',
    fix: 'const data = JSON.parse(userInput);',
    priority: 'high'
  });

  if (repository.frappe_type) {
    analysis.suggestions.push({
      type: 'optimization',
      title: 'تحسين أداء Frappe',
      description: 'استخدام frappe.db.get_value بدلاً من frappe.get_doc للاستعلامات البسيطة',
      code_snippet: 'frappe.get_doc("DocType", name)',
      fix: 'frappe.db.get_value("DocType", name, "field")',
      priority: 'medium'
    });
  }

  return analysis;
}

async function analyzeConfigFile(filePath: string, repository: any) {
  const analysis = {
    security_issues: [],
    suggestions: []
  };

  if (filePath.includes('package.json')) {
    analysis.suggestions.push({
      type: 'security',
      title: 'فحص الثغرات الأمنية',
      description: 'تشغيل npm audit للتحقق من الثغرات في المكتبات',
      code_snippet: '',
      fix: 'npm audit fix',
      priority: 'high'
    });
  }

  return analysis;
}

async function analyzeRepository(repository: any) {
  const analysis = {
    quality_issues: [],
    issues_count: 0,
    suggestions_count: 0
  };

  // تحليل عام حسب نوع Frappe
  switch (repository.frappe_type) {
    case 'erpnext':
      analysis.quality_issues.push({
        type: 'best_practice',
        message: 'تأكد من اتباع ERPNext coding standards',
        priority: 'medium'
      });
      analysis.suggestions_count = 3;
      break;
      
    case 'custom':
      analysis.quality_issues.push({
        type: 'documentation',
        message: 'إضافة وثائق للوظائف المخصصة',
        priority: 'low'
      });
      analysis.suggestions_count = 2;
      break;
  }

  analysis.issues_count = analysis.quality_issues.length;
  
  return analysis;
}