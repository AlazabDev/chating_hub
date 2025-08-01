import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, contextFiles } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create a temporary user session for now
    const userId = 'temp-user-' + Date.now();

    // Get conversation history
    let conversation;
    if (conversationId) {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();
      conversation = data;
    } else {
      // Create new conversation
      const { data } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          title: message.substring(0, 50) + '...',
          model: 'claude'
        })
        .select()
        .single();
      conversation = data;
    }

    // Get message history
    const { data: messages } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    // Build context with file contents if provided
    let systemPrompt = "أنت مساعد ذكي يتحدث العربية ويساعد في البرمجة وإدارة الملفات والمشاريع.";
    
    if (contextFiles && contextFiles.length > 0) {
      systemPrompt += "\n\nالملفات المتاحة في السياق:\n";
      contextFiles.forEach((file: any) => {
        systemPrompt += `\n--- ${file.name} ---\n${file.content}\n`;
      });
    }

    // Prepare messages for Claude
    const claudeMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'human' : 'assistant',
        content: msg.content
      })),
      { role: 'human', content: message }
    ];

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: claudeMessages.filter(m => m.role !== 'system'),
        system: systemPrompt
      })
    });

    const claudeData = await claudeResponse.json();
    const assistantResponse = claudeData.content[0].text;

    // Save user message
    await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: message
      });

    // Save assistant response
    await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: assistantResponse
      });

    // Update conversation timestamp
    await supabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation.id);

    return new Response(JSON.stringify({
      response: assistantResponse,
      conversationId: conversation.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in claude-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});