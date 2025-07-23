import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupRequest {
  action: 'create_backup' | 'get_backup_status' | 'schedule_backup';
  user_id?: string;
  backup_type?: 'weekly_chat' | 'manual_chat';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from Authorization header
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authorization.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, backup_type = 'manual_chat' }: BackupRequest = await req.json();

    switch (action) {
      case 'create_backup':
        return await createBackup(supabase, user.id, backup_type);
      case 'get_backup_status':
        return await getBackupStatus(supabase, user.id);
      case 'schedule_backup':
        return await scheduleBackup(supabase, user.id);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Backup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createBackup(supabase: any, userId: string, backupType: string) {
  try {
    // إنشاء مهمة نسخ احتياطي جديدة
    const { data: backupJob, error: jobError } = await supabase
      .from('backup_jobs')
      .insert({
        user_id: userId,
        backup_type: backupType,
        status: 'processing',
        scheduled_at: new Date().toISOString(),
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // جمع بيانات المحادثات
    const { data: conversations, error: convError } = await supabase
      .from('ai_conversations')
      .select(`
        *,
        ai_messages(*),
        chat_attachments(*)
      `)
      .eq('user_id', userId);

    if (convError) throw convError;

    // تحضير البيانات للنسخ الاحتياطي
    const backupData = {
      export_date: new Date().toISOString(),
      user_id: userId,
      conversations: conversations || [],
      metadata: {
        total_conversations: conversations?.length || 0,
        total_messages: conversations?.reduce((acc, conv) => acc + (conv.ai_messages?.length || 0), 0) || 0,
        backup_type: backupType
      }
    };

    // تحويل البيانات إلى JSON
    const jsonData = JSON.stringify(backupData, null, 2);
    const fileName = `chat_backup_${userId}_${new Date().toISOString().split('T')[0]}.json`;

    // رفع الملف إلى التخزين
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('backups')
      .upload(`${userId}/${fileName}`, new Blob([jsonData], { type: 'application/json' }));

    if (uploadError) throw uploadError;

    // الحصول على رابط الملف
    const { data: { publicUrl } } = supabase.storage
      .from('backups')
      .getPublicUrl(`${userId}/${fileName}`);

    // رفع إلى Google Drive إذا كان API متاحاً
    let driveFileId = null;
    try {
      driveFileId = await uploadToGoogleDrive(fileName, jsonData);
    } catch (driveError) {
      console.error('Google Drive upload failed:', driveError);
    }

    // تحديث مهمة النسخ الاحتياطي
    const { error: updateError } = await supabase
      .from('backup_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        file_url: publicUrl,
        drive_file_id: driveFileId,
        metadata: backupData.metadata
      })
      .eq('id', backupJob.id);

    if (updateError) throw updateError;

    // جدولة النسخة الاحتياطية التالية إذا كانت أسبوعية
    if (backupType === 'weekly_chat') {
      await scheduleNextBackup(supabase, userId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        backup_id: backupJob.id,
        file_url: publicUrl,
        drive_file_id: driveFileId,
        message: 'تم إنشاء النسخة الاحتياطية بنجاح'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create backup error:', error);
    return new Response(
      JSON.stringify({ error: 'فشل في إنشاء النسخة الاحتياطية' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function uploadToGoogleDrive(fileName: string, fileContent: string): Promise<string | null> {
  const apiKey = Deno.env.get('GOOGLE_DRIVE_API_KEY');
  if (!apiKey) {
    console.log('Google Drive API key not configured');
    return null;
  }

  try {
    // رفع الملف إلى Google Drive
    const metadata = {
      name: fileName,
      parents: [''] // يمكن تحديد مجلد معين هنا
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent], { type: 'application/json' }));

    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${apiKey}`,
      {
        method: 'POST',
        body: form,
      }
    );

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.id;

  } catch (error) {
    console.error('Google Drive upload error:', error);
    throw error;
  }
}

async function getBackupStatus(supabase: any, userId: string) {
  try {
    const { data: backups, error } = await supabase
      .from('backup_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, backups }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get backup status error:', error);
    return new Response(
      JSON.stringify({ error: 'فشل في جلب حالة النسخ الاحتياطية' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function scheduleBackup(supabase: any, userId: string) {
  try {
    await scheduleNextBackup(supabase, userId);

    return new Response(
      JSON.stringify({ success: true, message: 'تم جدولة النسخة الاحتياطية التالية' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Schedule backup error:', error);
    return new Response(
      JSON.stringify({ error: 'فشل في جدولة النسخة الاحتياطية' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function scheduleNextBackup(supabase: any, userId: string) {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await supabase
    .from('backup_jobs')
    .insert({
      user_id: userId,
      backup_type: 'weekly_chat',
      status: 'pending',
      scheduled_at: nextWeek.toISOString()
    });
}