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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, model = 'deepseek', conversationId, repositoryContext } = await req.json();
    
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    let conversation;
    let messages = [];

    // إذا كان لدينا conversationId، احضر المحادثة الموجودة
    if (conversationId) {
      const { data: existingConversation } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      
      if (existingConversation) {
        conversation = existingConversation;
        
        // احضر رسائل المحادثة
        const { data: existingMessages } = await supabase
          .from('ai_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        
        messages = existingMessages || [];
      }
    }

    // إذا لم تكن هناك محادثة، أنشئ واحدة جديدة
    if (!conversation) {
      const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      const { data: newConversation, error: convError } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          title,
          model
        })
        .select()
        .single();

      if (convError) throw convError;
      conversation = newConversation;
    }

    // أضف رسالة المستخدم
    const { error: messageError } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: message,
        metadata: { repositoryContext }
      });

    if (messageError) throw messageError;

    // احضر السياق للذكاء الاصطناعي
    const contextPrompt = await buildContextPrompt(supabase, repositoryContext, user.id);

    // إعداد الرسائل للذكاء الاصطناعي
    const aiMessages = [
      {
        role: 'system',
        content: `أنت مساعد ذكي متخصص في تطوير البرمجيات وإدارة المشاريع. ${contextPrompt}`
      },
      ...messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // استدعاء الذكاء الاصطناعي
    let aiResponse;
    if (model === 'openai') {
      aiResponse = await callOpenAI(aiMessages);
    } else {
      aiResponse = await callDeepSeek(aiMessages);
    }

    // حفظ رد الذكاء الاصطناعي
    const { error: responseError } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: aiResponse,
        metadata: { model }
      });

    if (responseError) throw responseError;

    // تحليل الرد للبحث عن اقتراحات للكود
    if (repositoryContext?.repositoryId) {
      await analyzeResponseForCodeSuggestions(
        supabase, 
        aiResponse, 
        repositoryContext.repositoryId,
        repositoryContext.currentFiles
      );
    }

    return new Response(JSON.stringify({
      response: aiResponse,
      conversationId: conversation.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function buildContextPrompt(supabase: any, repositoryContext: any, userId: string): Promise<string> {
  let context = '';
  
  if (repositoryContext?.repositoryId) {
    // احضر معلومات المستودع
    const { data: repository } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repositoryContext.repositoryId)
      .single();

    if (repository) {
      context += `أنت تعمل على مستودع: ${repository.name} (${repository.frappe_type})\n`;
      context += `الوصف: ${repository.description}\n`;
    }

    // احضر الملفات الحالية
    if (repositoryContext.currentFiles) {
      context += `الملفات المفتوحة حالياً: ${repositoryContext.currentFiles.join(', ')}\n`;
    }

    // احضر التحليلات الأخيرة
    const { data: analysis } = await supabase
      .from('code_analysis')
      .select('*')
      .eq('repository_id', repositoryContext.repositoryId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (analysis) {
      context += `التحليل الأخير: ${analysis.issues_found} مشكلة، ${analysis.suggestions_count} اقتراح\n`;
    }
  }

  return context;
}

async function callOpenAI(messages: any[]): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'OpenAI API error');
  
  return data.choices[0].message.content;
}

async function callDeepSeek(messages: any[]): Promise<string> {
  const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
  if (!apiKey) throw new Error('DeepSeek API key not configured');

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'DeepSeek API error');
  
  return data.choices[0].message.content;
}

async function analyzeResponseForCodeSuggestions(
  supabase: any, 
  response: string, 
  repositoryId: string, 
  currentFiles: string[]
): Promise<void> {
  // البحث عن كلمات مفتاحية تدل على اقتراحات للكود
  const suggestionKeywords = [
    'يمكن تحسين',
    'أقترح',
    'يجب إصلاح',
    'مشكلة أمنية',
    'optimization',
    'bug fix',
    'security issue',
    'improvement'
  ];

  const hasSuggestion = suggestionKeywords.some(keyword => 
    response.toLowerCase().includes(keyword.toLowerCase())
  );

  if (hasSuggestion && currentFiles?.length > 0) {
    // إنشاء اقتراح تلقائي
    const suggestion = {
      repository_id: repositoryId,
      file_path: currentFiles[0],
      suggestion_type: 'improvement',
      title: 'اقتراح من الذكاء الاصطناعي',
      description: response.substring(0, 500),
      priority: 'medium',
      status: 'pending',
      created_by_ai: true
    };

    await supabase
      .from('code_suggestions')
      .insert(suggestion);
  }
}