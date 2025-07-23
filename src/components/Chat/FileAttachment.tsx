import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Paperclip, 
  Upload, 
  File, 
  Image, 
  FileText, 
  Video,
  Music,
  Archive,
  X,
  Download
} from 'lucide-react';

interface FileAttachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
}

interface FileAttachmentProps {
  conversationId?: string;
  messageId?: string;
  attachments: FileAttachment[];
  onAttachmentAdded: (attachment: FileAttachment) => void;
  onAttachmentRemoved: (attachmentId: string) => void;
  disabled?: boolean;
}

const FileAttachment: React.FC<FileAttachmentProps> = ({
  conversationId,
  messageId,
  attachments,
  onAttachmentAdded,
  onAttachmentRemoved,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // التحقق من حجم الملف (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "خطأ في الرفع",
        description: "حجم الملف يجب أن يكون أقل من 10 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('المستخدم غير مصادق عليه');
      }

      // رفع الملف إلى التخزين
      const fileName = `${user.user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // الحصول على رابط الملف
      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      // حفظ معلومات المرفق في قاعدة البيانات
      const { data: attachmentData, error: dbError } = await supabase
        .from('chat_attachments')
        .insert({
          conversation_id: conversationId,
          message_id: messageId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: publicUrl,
          uploaded_by: user.user.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      onAttachmentAdded({
        id: attachmentData.id,
        file_name: attachmentData.file_name,
        file_type: attachmentData.file_type,
        file_size: attachmentData.file_size,
        file_url: attachmentData.file_url,
        created_at: attachmentData.created_at
      });

      toast({
        title: "تم الرفع بنجاح",
        description: `تم رفع ${file.name} بنجاح`
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "خطأ في الرفع",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء رفع الملف",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      const { error } = await supabase
        .from('chat_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;

      onAttachmentRemoved(attachmentId);
      
      toast({
        title: "تم الحذف",
        description: "تم حذف المرفق بنجاح"
      });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف المرفق",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (fileType.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-4 h-4" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (attachment: FileAttachment) => {
    window.open(attachment.file_url, '_blank');
  };

  return (
    <div className="space-y-2">
      {/* قائمة المرفقات */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg border"
            >
              {getFileIcon(attachment.file_type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.file_size)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  className="h-6 w-6 p-0"
                >
                  <Download className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* زر الرفع */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFileSelect}
          disabled={disabled || uploading}
          className="flex items-center gap-2"
        >
          {uploading ? (
            <Upload className="w-4 h-4 animate-spin" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
          {uploading ? 'جاري الرفع...' : 'إرفاق ملف'}
        </Button>
        
        {attachments.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {attachments.length} مرفق
          </Badge>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
      />
    </div>
  );
};

export default FileAttachment;