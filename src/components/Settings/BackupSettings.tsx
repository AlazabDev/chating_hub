import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Cloud, 
  Download, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  HardDrive
} from 'lucide-react';

interface BackupJob {
  id: string;
  backup_type: string;
  status: string;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  file_url?: string;
  drive_file_id?: string;
  error_message?: string;
  metadata?: any;
}

const BackupSettings: React.FC = () => {
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBackupStatus();
  }, []);

  const loadBackupStatus = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('google-drive-backup', {
        body: { action: 'get_backup_status' }
      });

      if (response.error) throw response.error;

      setBackupJobs(response.data.backups || []);
    } catch (error) {
      console.error('Error loading backup status:', error);
      toast({
        title: "خطأ في التحميل",
        description: "فشل في تحميل حالة النسخ الاحتياطية",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createManualBackup = async () => {
    setCreatingBackup(true);
    try {
      const response = await supabase.functions.invoke('google-drive-backup', {
        body: { 
          action: 'create_backup',
          backup_type: 'manual_chat'
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء نسخة احتياطية يدوية بنجاح"
      });

      // إعادة تحميل حالة النسخ الاحتياطية
      await loadBackupStatus();

    } catch (error) {
      console.error('Manual backup error:', error);
      toast({
        title: "خطأ في النسخ الاحتياطي",
        description: "فشل في إنشاء النسخة الاحتياطية اليدوية",
        variant: "destructive"
      });
    } finally {
      setCreatingBackup(false);
    }
  };

  const toggleAutoBackup = async () => {
    try {
      const newState = !autoBackupEnabled;
      setAutoBackupEnabled(newState);

      if (newState) {
        // تفعيل النسخ الاحتياطي التلقائي
        const response = await supabase.functions.invoke('google-drive-backup', {
          body: { action: 'schedule_backup' }
        });

        if (response.error) throw response.error;

        toast({
          title: "تم التفعيل",
          description: "تم تفعيل النسخ الاحتياطي التلقائي الأسبوعي"
        });
      } else {
        toast({
          title: "تم الإلغاء",
          description: "تم إلغاء النسخ الاحتياطي التلقائي"
        });
      }

      await loadBackupStatus();
    } catch (error) {
      console.error('Toggle auto backup error:', error);
      setAutoBackupEnabled(!autoBackupEnabled); // العودة للحالة السابقة
      toast({
        title: "خطأ",
        description: "فشل في تغيير إعدادات النسخ الاحتياطي",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتملة';
      case 'failed': return 'فشلت';
      case 'processing': return 'قيد المعالجة';
      case 'pending': return 'مجدولة';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadBackup = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* إعدادات النسخ الاحتياطي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            إعدادات النسخ الاحتياطي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">النسخ الاحتياطي التلقائي الأسبوعي</h4>
              <p className="text-sm text-muted-foreground">
                إنشاء نسخة احتياطية من المحادثات تلقائياً كل أسبوع
              </p>
            </div>
            <Switch
              checked={autoBackupEnabled}
              onCheckedChange={toggleAutoBackup}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={createManualBackup}
              disabled={creatingBackup}
              className="flex items-center gap-2"
            >
              {creatingBackup ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              إنشاء نسخة احتياطية يدوية
            </Button>
            
            <Button
              variant="outline"
              onClick={loadBackupStatus}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* سجل النسخ الاحتياطية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            سجل النسخ الاحتياطية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="mr-2">جاري التحميل...</span>
              </div>
            ) : backupJobs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                لا توجد نسخ احتياطية حتى الآن
              </div>
            ) : (
              <div className="space-y-3">
                {backupJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {job.backup_type === 'weekly_chat' ? 'نسخة أسبوعية' : 'نسخة يدوية'}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {getStatusText(job.status)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {job.scheduled_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              مجدولة: {formatDate(job.scheduled_at)}
                            </div>
                          )}
                          {job.completed_at && (
                            <div>اكتملت: {formatDate(job.completed_at)}</div>
                          )}
                          {job.metadata && (
                            <div>
                              المحادثات: {job.metadata.total_conversations || 0} | 
                              الرسائل: {job.metadata.total_messages || 0}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.drive_file_id && (
                        <Badge variant="secondary" className="text-xs">
                          <Cloud className="w-3 h-3 mr-1" />
                          Google Drive
                        </Badge>
                      )}
                      
                      {job.file_url && job.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadBackup(
                            job.file_url!,
                            `backup_${job.id}.json`
                          )}
                          className="flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          تحميل
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupSettings;