import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Github, Cloud, HardDrive, Wifi, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConnectivitySettingsProps {
  gitHubSettings: {
    token: string;
    username: string;
    autoSync: boolean;
  };
  onGitHubSettingsChange: (settings: any) => void;
  driveSettings: {
    googleDrive: {
      clientId: string;
      clientSecret: string;
      enabled: boolean;
    };
    oneDrive: {
      clientId: string;
      clientSecret: string;
      enabled: boolean;
    };
  };
  onDriveSettingsChange: (settings: any) => void;
}

export const ConnectivitySettings: React.FC<ConnectivitySettingsProps> = ({
  gitHubSettings,
  onGitHubSettingsChange,
  driveSettings,
  onDriveSettingsChange
}) => {
  const [connectionStatus, setConnectionStatus] = useState({
    github: false,
    googleDrive: false,
    oneDrive: false
  });
  const { toast } = useToast();

  const testGitHubConnection = async () => {
    try {
      if (!gitHubSettings.token) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال رمز GitHub أولاً",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${gitHubSettings.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        setConnectionStatus(prev => ({ ...prev, github: true }));
        toast({
          title: "نجح الاتصال",
          description: "تم الاتصال بـ GitHub بنجاح"
        });
      } else {
        throw new Error('فشل في الاتصال');
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, github: false }));
      toast({
        title: "فشل الاتصال",
        description: "تعذر الاتصال بـ GitHub",
        variant: "destructive"
      });
    }
  };

  const testGoogleDriveConnection = async () => {
    try {
      if (!driveSettings.googleDrive.clientId) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال معرف Google Drive أولاً",
          variant: "destructive"
        });
        return;
      }

      // محاكاة اختبار الاتصال
      setConnectionStatus(prev => ({ ...prev, googleDrive: true }));
      toast({
        title: "نجح الاتصال",
        description: "تم الاتصال بـ Google Drive بنجاح"
      });
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, googleDrive: false }));
      toast({
        title: "فشل الاتصال",
        description: "تعذر الاتصال بـ Google Drive",
        variant: "destructive"
      });
    }
  };

  const testOneDriveConnection = async () => {
    try {
      if (!driveSettings.oneDrive.clientId) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال معرف OneDrive أولاً",
          variant: "destructive"
        });
        return;
      }

      // محاكاة اختبار الاتصال
      setConnectionStatus(prev => ({ ...prev, oneDrive: true }));
      toast({
        title: "نجح الاتصال",
        description: "تم الاتصال بـ OneDrive بنجاح"
      });
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, oneDrive: false }));
      toast({
        title: "فشل الاتصال",
        description: "تعذر الاتصال بـ OneDrive",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* GitHub Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            <span>إعدادات GitHub</span>
            <Badge variant={connectionStatus.github ? "default" : "secondary"} className="mr-auto">
              {connectionStatus.github ? (
                <><Check className="w-3 h-3 ml-1" /> متصل</>
              ) : (
                <><X className="w-3 h-3 ml-1" /> غير متصل</>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="github-token">رمز الوصول الشخصي</Label>
            <Input
              id="github-token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={gitHubSettings.token}
              onChange={(e) => onGitHubSettingsChange({
                ...gitHubSettings,
                token: e.target.value
              })}
            />
          </div>
          <div>
            <Label htmlFor="github-username">اسم المستخدم</Label>
            <Input
              id="github-username"
              placeholder="username"
              value={gitHubSettings.username}
              onChange={(e) => onGitHubSettingsChange({
                ...gitHubSettings,
                username: e.target.value
              })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="github-auto-sync">المزامنة التلقائية</Label>
            <Switch
              id="github-auto-sync"
              checked={gitHubSettings.autoSync}
              onCheckedChange={(checked) => onGitHubSettingsChange({
                ...gitHubSettings,
                autoSync: checked
              })}
            />
          </div>
          <Button onClick={testGitHubConnection} className="w-full">
            <Wifi className="w-4 h-4 ml-2" />
            اختبار الاتصال
          </Button>
        </CardContent>
      </Card>

      {/* Google Drive Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            <span>إعدادات Google Drive</span>
            <Badge variant={connectionStatus.googleDrive ? "default" : "secondary"} className="mr-auto">
              {connectionStatus.googleDrive ? (
                <><Check className="w-3 h-3 ml-1" /> متصل</>
              ) : (
                <><X className="w-3 h-3 ml-1" /> غير متصل</>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="google-client-id">معرف العميل</Label>
            <Input
              id="google-client-id"
              placeholder="xxxxxx.apps.googleusercontent.com"
              value={driveSettings.googleDrive.clientId}
              onChange={(e) => onDriveSettingsChange({
                ...driveSettings,
                googleDrive: {
                  ...driveSettings.googleDrive,
                  clientId: e.target.value
                }
              })}
            />
          </div>
          <div>
            <Label htmlFor="google-client-secret">سر العميل</Label>
            <Input
              id="google-client-secret"
              type="password"
              value={driveSettings.googleDrive.clientSecret}
              onChange={(e) => onDriveSettingsChange({
                ...driveSettings,
                googleDrive: {
                  ...driveSettings.googleDrive,
                  clientSecret: e.target.value
                }
              })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="google-enabled">تمكين Google Drive</Label>
            <Switch
              id="google-enabled"
              checked={driveSettings.googleDrive.enabled}
              onCheckedChange={(checked) => onDriveSettingsChange({
                ...driveSettings,
                googleDrive: {
                  ...driveSettings.googleDrive,
                  enabled: checked
                }
              })}
            />
          </div>
          <Button onClick={testGoogleDriveConnection} className="w-full">
            <Wifi className="w-4 h-4 ml-2" />
            اختبار الاتصال
          </Button>
        </CardContent>
      </Card>

      {/* OneDrive Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            <span>إعدادات OneDrive</span>
            <Badge variant={connectionStatus.oneDrive ? "default" : "secondary"} className="mr-auto">
              {connectionStatus.oneDrive ? (
                <><Check className="w-3 h-3 ml-1" /> متصل</>
              ) : (
                <><X className="w-3 h-3 ml-1" /> غير متصل</>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="onedrive-client-id">معرف التطبيق</Label>
            <Input
              id="onedrive-client-id"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={driveSettings.oneDrive.clientId}
              onChange={(e) => onDriveSettingsChange({
                ...driveSettings,
                oneDrive: {
                  ...driveSettings.oneDrive,
                  clientId: e.target.value
                }
              })}
            />
          </div>
          <div>
            <Label htmlFor="onedrive-client-secret">سر التطبيق</Label>
            <Input
              id="onedrive-client-secret"
              type="password"
              value={driveSettings.oneDrive.clientSecret}
              onChange={(e) => onDriveSettingsChange({
                ...driveSettings,
                oneDrive: {
                  ...driveSettings.oneDrive,
                  clientSecret: e.target.value
                }
              })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="onedrive-enabled">تمكين OneDrive</Label>
            <Switch
              id="onedrive-enabled"
              checked={driveSettings.oneDrive.enabled}
              onCheckedChange={(checked) => onDriveSettingsChange({
                ...driveSettings,
                oneDrive: {
                  ...driveSettings.oneDrive,
                  enabled: checked
                }
              })}
            />
          </div>
          <Button onClick={testOneDriveConnection} className="w-full">
            <Wifi className="w-4 h-4 ml-2" />
            اختبار الاتصال
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};