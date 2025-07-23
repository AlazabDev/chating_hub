import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Running backup scheduler...');

    // البحث عن المهام المجدولة المستحقة
    const now = new Date().toISOString();
    const { data: pendingJobs, error: jobsError } = await supabase
      .from('backup_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now);

    if (jobsError) throw jobsError;

    console.log(`Found ${pendingJobs?.length || 0} pending backup jobs`);

    // تنفيذ النسخ الاحتياطية المستحقة
    for (const job of pendingJobs || []) {
      try {
        console.log(`Processing backup job ${job.id} for user ${job.user_id}`);

        // تحديث حالة المهمة إلى "processing"
        await supabase
          .from('backup_jobs')
          .update({
            status: 'processing',
            started_at: new Date().toISOString()
          })
          .eq('id', job.id);

        // استدعاء دالة إنشاء النسخة الاحتياطية
        const backupResponse = await fetch(`${supabaseUrl}/functions/v1/google-drive-backup`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create_backup',
            user_id: job.user_id,
            backup_type: job.backup_type
          })
        });

        if (!backupResponse.ok) {
          throw new Error(`Backup failed with status: ${backupResponse.status}`);
        }

        const backupResult = await backupResponse.json();
        console.log(`Backup completed for job ${job.id}:`, backupResult);

        // إرسال إشعار للمستخدم
        await supabase
          .from('notifications')
          .insert({
            user_id: job.user_id,
            type: 'backup_completed',
            title: 'تمت النسخة الاحتياطية',
            message: `تم إنشاء نسخة احتياطية من محادثاتك بنجاح`,
            entity_type: 'backup_job',
            entity_id: job.id
          });

      } catch (error) {
        console.error(`Backup job ${job.id} failed:`, error);

        // تحديث حالة المهمة إلى "failed"
        await supabase
          .from('backup_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', job.id);

        // إرسال إشعار بالفشل
        await supabase
          .from('notifications')
          .insert({
            user_id: job.user_id,
            type: 'backup_failed',
            title: 'فشلت النسخة الاحتياطية',
            message: `حدث خطأ أثناء إنشاء النسخة الاحتياطية`,
            entity_type: 'backup_job',
            entity_id: job.id
          });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed_jobs: pendingJobs?.length || 0,
        message: 'Backup scheduler completed successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Backup scheduler error:', error);
    return new Response(
      JSON.stringify({ error: 'Backup scheduler failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});