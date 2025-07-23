import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RepositoryRequest {
  action: 'execute_operation' | 'get_status' | 'get_logs';
  repository_id?: string;
  operation_type?: 'clone' | 'pull' | 'push' | 'build' | 'deploy' | 'install' | 'migrate';
  parameters?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // التحقق من المصادقة
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, repository_id, operation_type, parameters }: RepositoryRequest = await req.json();

    console.log(`Repository API: ${action} for user ${user.id}`);

    switch (action) {
      case 'execute_operation':
        return await executeRepositoryOperation(supabaseClient, user.id, repository_id!, operation_type!, parameters);
      
      case 'get_status':
        return await getRepositoryStatus(supabaseClient, repository_id!);
      
      case 'get_logs':
        return await getOperationLogs(supabaseClient, repository_id!);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Repository API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function executeRepositoryOperation(
  supabase: any,
  userId: string,
  repositoryId: string,
  operationType: string,
  parameters: Record<string, any> = {}
) {
  try {
    // التحقق من وجود المستودع وصلاحيات المستخدم
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repositoryId)
      .single();

    if (repoError || !repository) {
      throw new Error('Repository not found');
    }

    // إنشاء سجل عملية جديد
    const { data: operation, error: opError } = await supabase
      .from('repository_operations')
      .insert([{
        repository_id: repositoryId,
        operation_type: operationType,
        initiated_by: userId,
        status: 'running',
        parameters: parameters
      }])
      .select()
      .single();

    if (opError) {
      throw new Error('Failed to create operation record');
    }

    // محاكاة تنفيذ العملية
    const operationResult = await simulateOperation(operationType, repository, parameters);

    // تحديث حالة العملية
    const { error: updateError } = await supabase
      .from('repository_operations')
      .update({
        status: operationResult.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        logs: operationResult.logs,
        result: operationResult.result
      })
      .eq('id', operation.id);

    if (updateError) {
      console.error('Failed to update operation status:', updateError);
    }

    // تحديث آخر مزامنة للمستودع
    if (operationResult.success && ['pull', 'push', 'clone'].includes(operationType)) {
      await supabase
        .from('repositories')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', repositoryId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        operation_id: operation.id,
        result: operationResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Execute operation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function simulateOperation(operationType: string, repository: any, parameters: any) {
  // محاكاة تأخير العملية
  await new Promise(resolve => setTimeout(resolve, 2000));

  const logs: string[] = [];
  let success = true;
  const result: Record<string, any> = {};

  switch (operationType) {
    case 'clone':
      logs.push(`Cloning repository from ${repository.git_url}...`);
      logs.push(`Switching to branch ${repository.branch}...`);
      logs.push('Repository cloned successfully');
      result.cloned_at = new Date().toISOString();
      break;

    case 'pull':
      logs.push(`Pulling latest changes from ${repository.branch}...`);
      logs.push('Fast-forward merge completed');
      logs.push('Repository updated successfully');
      result.commits_pulled = Math.floor(Math.random() * 10) + 1;
      break;

    case 'push':
      logs.push(`Pushing changes to ${repository.branch}...`);
      logs.push('All changes pushed successfully');
      result.commits_pushed = Math.floor(Math.random() * 5) + 1;
      break;

    case 'build':
      logs.push('Installing dependencies...');
      logs.push('Running bench build...');
      logs.push('Build completed successfully');
      result.build_time = `${Math.floor(Math.random() * 300) + 60}s`;
      break;

    case 'deploy':
      logs.push('Preparing deployment...');
      logs.push('Running database migrations...');
      logs.push('Restarting services...');
      logs.push('Deployment completed successfully');
      result.deployed_at = new Date().toISOString();
      break;

    case 'install':
      logs.push('Installing Frappe app...');
      logs.push('Running app installation...');
      logs.push('App installed successfully');
      result.app_installed = repository.name;
      break;

    case 'migrate':
      logs.push('Running database migrations...');
      logs.push('Migrating site database...');
      logs.push('Migrations completed successfully');
      result.migrations_run = Math.floor(Math.random() * 5) + 1;
      break;

    default:
      logs.push(`Unknown operation: ${operationType}`);
      success = false;
  }

  // محاكاة إمكانية الفشل (10% احتمال)
  if (Math.random() < 0.1) {
    success = false;
    logs.push(`ERROR: Operation failed with code ${Math.floor(Math.random() * 100) + 1}`);
  }

  return {
    success,
    logs: logs.join('\n'),
    result
  };
}

async function getRepositoryStatus(supabase: any, repositoryId: string) {
  try {
    const { data: repository, error } = await supabase
      .from('repositories')
      .select(`
        *,
        repository_operations!repository_operations_repository_id_fkey (
          id,
          operation_type,
          status,
          started_at,
          completed_at
        )
      `)
      .eq('id', repositoryId)
      .single();

    if (error) {
      throw new Error('Repository not found');
    }

    return new Response(
      JSON.stringify({ repository }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getOperationLogs(supabase: any, repositoryId: string) {
  try {
    const { data: operations, error } = await supabase
      .from('repository_operations')
      .select('*')
      .eq('repository_id', repositoryId)
      .order('started_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error('Failed to fetch operation logs');
    }

    return new Response(
      JSON.stringify({ operations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}