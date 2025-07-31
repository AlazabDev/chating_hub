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
    const { action, fileId, fileName, content, parentId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleDriveApiKey = Deno.env.get('GOOGLE_DRIVE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    let result;

    switch (action) {
      case 'list':
        // List files from Google Drive
        const listUrl = `https://www.googleapis.com/drive/v3/files?key=${googleDriveApiKey}&q=${parentId ? `'${parentId}' in parents` : 'parents in "root"'}&fields=files(id,name,mimeType,createdTime,modifiedTime,size)`;
        const listResponse = await fetch(listUrl);
        const listData = await listResponse.json();
        result = listData.files || [];
        break;

      case 'download':
        // Download file content from Google Drive
        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${googleDriveApiKey}`;
        const downloadResponse = await fetch(downloadUrl);
        const fileContent = await downloadResponse.text();
        result = { content: fileContent };
        break;

      case 'upload':
        // Upload file to Google Drive
        const metadata = {
          name: fileName,
          parents: parentId ? [parentId] : undefined
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([content], { type: 'text/plain' }));

        const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${googleDriveApiKey}`;
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: form
        });
        const uploadData = await uploadResponse.json();
        result = uploadData;
        break;

      case 'update':
        // Update file content in Google Drive
        const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&key=${googleDriveApiKey}`;
        const updateResponse = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'text/plain'
          },
          body: content
        });
        const updateData = await updateResponse.json();
        result = updateData;
        break;

      case 'delete':
        // Delete file from Google Drive
        const deleteUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?key=${googleDriveApiKey}`;
        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE'
        });
        result = { success: deleteResponse.ok };
        break;

      case 'create-folder':
        // Create folder in Google Drive
        const folderMetadata = {
          name: fileName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentId ? [parentId] : undefined
        };

        const folderUrl = `https://www.googleapis.com/drive/v3/files?key=${googleDriveApiKey}`;
        const folderResponse = await fetch(folderUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(folderMetadata)
        });
        const folderData = await folderResponse.json();
        result = folderData;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Log the operation
    await supabase
      .from('activity_log')
      .insert({
        entity_type: 'google_drive',
        entity_id: fileId || 'unknown',
        action: action,
        description: `Google Drive ${action} operation`,
        performed_by: user.id,
        metadata: { fileName, parentId }
      });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in google-drive-files function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});