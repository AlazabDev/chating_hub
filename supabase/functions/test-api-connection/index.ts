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
    const { provider } = await req.json();
    
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // احضار مفتاح API للمزود المحدد
    const { data: apiKey, error: keyError } = await supabase
      .from('api_keys')
      .select('encrypted_key')
      .eq('provider', provider)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (keyError || !apiKey) {
      return new Response(JSON.stringify({
        success: false,
        message: `لم يتم العثور على مفتاح API نشط للمزود ${provider}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // فك تشفير المفتاح
    const { data: decryptedKey, error: decryptError } = await supabase
      .rpc('decrypt_api_key', { encrypted_key: apiKey.encrypted_key });

    if (decryptError) {
      throw new Error('Failed to decrypt API key');
    }

    let testResult = { success: false, message: '' };

    // اختبار الاتصال حسب المزود
    switch (provider) {
      case 'openai':
        testResult = await testOpenAI(decryptedKey);
        break;
      case 'anthropic':
        testResult = await testAnthropic(decryptedKey);
        break;
      case 'deepseek':
        testResult = await testDeepSeek(decryptedKey);
        break;
      case 'stripe':
        testResult = await testStripe(decryptedKey);
        break;
      case 'google_drive':
        testResult = await testGoogleDrive(decryptedKey);
        break;
      default:
        testResult = {
          success: false,
          message: `اختبار ${provider} غير مدعوم حالياً`
        };
    }

    // تسجيل نتيجة الاختبار
    await supabase
      .from('api_usage_logs')
      .insert({
        user_id: user.id,
        provider,
        endpoint: 'connection_test',
        status_code: testResult.success ? 200 : 400,
        error_message: testResult.success ? null : testResult.message,
        metadata: { test_type: 'connection' }
      });

    // تحديث آخر استخدام إذا نجح الاختبار
    if (testResult.success) {
      await supabase
        .from('api_keys')
        .update({ 
          last_used: new Date().toISOString(),
          usage_count: supabase.sql`usage_count + 1`
        })
        .eq('provider', provider)
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify(testResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in test-api-connection function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      message: error.message || 'حدث خطأ أثناء اختبار الاتصال'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function testOpenAI(apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return {
        success: true,
        message: 'تم الاتصال بـ OpenAI بنجاح'
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        message: `فشل الاتصال بـ OpenAI: ${error}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `خطأ في الاتصال بـ OpenAI: ${error.message}`
    };
  }
}

async function testAnthropic(apiKey: string) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    if (response.status === 200 || response.status === 400) {
      // 400 يعني أن API key صحيح لكن الطلب قد يكون غير صحيح
      return {
        success: true,
        message: 'تم الاتصال بـ Claude بنجاح'
      };
    } else if (response.status === 401) {
      return {
        success: false,
        message: 'مفتاح Claude غير صحيح'
      };
    } else {
      return {
        success: false,
        message: `فشل الاتصال بـ Claude: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `خطأ في الاتصال بـ Claude: ${error.message}`
    };
  }
}

async function testDeepSeek(apiKey: string) {
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10,
      }),
    });

    if (response.status === 200 || response.status === 400) {
      return {
        success: true,
        message: 'تم الاتصال بـ DeepSeek بنجاح'
      };
    } else if (response.status === 401) {
      return {
        success: false,
        message: 'مفتاح DeepSeek غير صحيح'
      };
    } else {
      return {
        success: false,
        message: `فشل الاتصال بـ DeepSeek: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `خطأ في الاتصال بـ DeepSeek: ${error.message}`
    };
  }
}

async function testStripe(apiKey: string) {
  try {
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return {
        success: true,
        message: 'تم الاتصال بـ Stripe بنجاح'
      };
    } else {
      return {
        success: false,
        message: `فشل الاتصال بـ Stripe: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `خطأ في الاتصال بـ Stripe: ${error.message}`
    };
  }
}

async function testGoogleDrive(apiKey: string) {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/about?fields=user&key=${apiKey}`);

    if (response.ok) {
      return {
        success: true,
        message: 'تم الاتصال بـ Google Drive بنجاح'
      };
    } else {
      return {
        success: false,
        message: `فشل الاتصال بـ Google Drive: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `خطأ في الاتصال بـ Google Drive: ${error.message}`
    };
  }
}