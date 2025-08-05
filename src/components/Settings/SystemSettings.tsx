import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import IntegrationsManager from './IntegrationsManager';
import { 
  Settings, 
  Database, 
  Shield, 
  Cpu, 
  Cloud,
  Bell,
  Mail,
  Key,
  Users,
  HardDrive,
  Network,
  Save,
  RefreshCw
} from 'lucide-react';

interface SystemConfig {
  general: {
    systemName: string;
    description: string;
    timezone: string;
    language: string;
    debugMode: boolean;
    maintenanceMode: boolean;
  };
  database: {
    host: string;
    port: number;
    name: string;
    backupEnabled: boolean;
    backupInterval: string;
    maxConnections: number;
  };
  security: {
    tokenExpiry: number;
    maxLoginAttempts: number;
    requireTwoFA: boolean;
    passwordPolicy: string;
    apiKeyRotation: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    cacheSize: number;
    compressionEnabled: boolean;
    rateLimitEnabled: boolean;
    maxRequestsPerMinute: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    emailServer: string;
    adminEmails: string;
  };
}

const SystemSettings: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<SystemConfig>({
    general: {
      systemName: 'منصة الذكاء الاصطناعي المتكاملة',
      description: 'منصة شاملة لإدارة المشاريع والذكاء الاصطناعي',
      timezone: 'Asia/Riyadh',
      language: 'ar',
      debugMode: false,
      maintenanceMode: false
    },
    database: {
      host: 'localhost',
      port: 5432,
      name: 'ai_platform',
      backupEnabled: true,
      backupInterval: 'daily',
      maxConnections: 100
    },
    security: {
      tokenExpiry: 24,
      maxLoginAttempts: 5,
      requireTwoFA: false,
      passwordPolicy: 'strong',
      apiKeyRotation: true
    },
    performance: {
      cacheEnabled: true,
      cacheSize: 256,
      compressionEnabled: true,
      rateLimitEnabled: true,
      maxRequestsPerMinute: 1000
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      emailServer: 'smtp.gmail.com',
      adminEmails: 'admin@example.com'
    }
  });

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // محاكاة حفظ الإعدادات
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات النظام بنجاح"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (type: string) => {
    try {
      // محاكاة اختبار الاتصال
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "نجح الاختبار",
        description: `تم اختبار ${type} بنجاح`
      });
    } catch (error) {
      toast({
        title: "فشل الاختبار",
        description: `فشل في اختبار ${type}`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إعدادات النظام</h2>
          <p className="text-muted-foreground">إدارة إعدادات وتكوين المنصة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            إعادة تحميل
          </Button>
          <Button onClick={saveSettings} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="integrations">التكاملات</TabsTrigger>
          <TabsTrigger value="database">قاعدة البيانات</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                الإعدادات العامة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="systemName">اسم النظام</Label>
                  <Input
                    id="systemName"
                    value={config.general.systemName}
                    onChange={(e) => updateConfig('general', 'systemName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="language">اللغة</Label>
                  <Select
                    value={config.general.language}
                    onValueChange={(value) => updateConfig('general', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">وصف النظام</Label>
                <Textarea
                  id="description"
                  value={config.general.description}
                  onChange={(e) => updateConfig('general', 'description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">المنطقة الزمنية</Label>
                  <Select
                    value={config.general.timezone}
                    onValueChange={(value) => updateConfig('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Riyadh">آسيا/الرياض</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">أمريكا/نيويورك</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>وضع التطوير</Label>
                    <p className="text-sm text-muted-foreground">تفعيل سجلات التطوير المفصلة</p>
                  </div>
                  <Switch
                    checked={config.general.debugMode}
                    onCheckedChange={(checked) => updateConfig('general', 'debugMode', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>وضع الصيانة</Label>
                    <p className="text-sm text-muted-foreground">منع الوصول للمستخدمين العاديين</p>
                  </div>
                  <Switch
                    checked={config.general.maintenanceMode}
                    onCheckedChange={(checked) => updateConfig('general', 'maintenanceMode', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsManager />
        </TabsContent>

        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                إعدادات قاعدة البيانات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dbHost">المضيف</Label>
                  <Input
                    id="dbHost"
                    value={config.database.host}
                    onChange={(e) => updateConfig('database', 'host', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dbPort">المنفذ</Label>
                  <Input
                    id="dbPort"
                    type="number"
                    value={config.database.port}
                    onChange={(e) => updateConfig('database', 'port', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="dbName">اسم قاعدة البيانات</Label>
                  <Input
                    id="dbName"
                    value={config.database.name}
                    onChange={(e) => updateConfig('database', 'name', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="backupInterval">فترة النسخ الاحتياطي</Label>
                  <Select
                    value={config.database.backupInterval}
                    onValueChange={(value) => updateConfig('database', 'backupInterval', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">كل ساعة</SelectItem>
                      <SelectItem value="daily">يومياً</SelectItem>
                      <SelectItem value="weekly">أسبوعياً</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxConnections">الحد الأقصى للاتصالات</Label>
                  <Input
                    id="maxConnections"
                    type="number"
                    value={config.database.maxConnections}
                    onChange={(e) => updateConfig('database', 'maxConnections', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>تفعيل النسخ الاحتياطي</Label>
                  <p className="text-sm text-muted-foreground">النسخ الاحتياطي التلقائي</p>
                </div>
                <Switch
                  checked={config.database.backupEnabled}
                  onCheckedChange={(checked) => updateConfig('database', 'backupEnabled', checked)}
                />
              </div>

              <div className="pt-4">
                <Button variant="outline" onClick={() => testConnection('قاعدة البيانات')}>
                  <Database className="w-4 h-4 mr-2" />
                  اختبار الاتصال
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                إعدادات الأمان
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tokenExpiry">انتهاء صلاحية الرمز (ساعات)</Label>
                  <Input
                    id="tokenExpiry"
                    type="number"
                    value={config.security.tokenExpiry}
                    onChange={(e) => updateConfig('security', 'tokenExpiry', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxLoginAttempts">عدد محاولات تسجيل الدخول</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="passwordPolicy">سياسة كلمة المرور</Label>
                <Select
                  value={config.security.passwordPolicy}
                  onValueChange={(value) => updateConfig('security', 'passwordPolicy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weak">ضعيفة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="strong">قوية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>المصادقة الثنائية</Label>
                    <p className="text-sm text-muted-foreground">إجبار المستخدمين على استخدام 2FA</p>
                  </div>
                  <Switch
                    checked={config.security.requireTwoFA}
                    onCheckedChange={(checked) => updateConfig('security', 'requireTwoFA', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>دوران مفاتيح API</Label>
                    <p className="text-sm text-muted-foreground">تجديد مفاتيح API تلقائياً</p>
                  </div>
                  <Switch
                    checked={config.security.apiKeyRotation}
                    onCheckedChange={(checked) => updateConfig('security', 'apiKeyRotation', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                إعدادات الأداء
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cacheSize">حجم التخزين المؤقت (MB)</Label>
                  <Input
                    id="cacheSize"
                    type="number"
                    value={config.performance.cacheSize}
                    onChange={(e) => updateConfig('performance', 'cacheSize', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxRequests">الحد الأقصى للطلبات في الدقيقة</Label>
                  <Input
                    id="maxRequests"
                    type="number"
                    value={config.performance.maxRequestsPerMinute}
                    onChange={(e) => updateConfig('performance', 'maxRequestsPerMinute', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تفعيل التخزين المؤقت</Label>
                    <p className="text-sm text-muted-foreground">تسريع الاستجابات</p>
                  </div>
                  <Switch
                    checked={config.performance.cacheEnabled}
                    onCheckedChange={(checked) => updateConfig('performance', 'cacheEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>ضغط البيانات</Label>
                    <p className="text-sm text-muted-foreground">تقليل حجم النقل</p>
                  </div>
                  <Switch
                    checked={config.performance.compressionEnabled}
                    onCheckedChange={(checked) => updateConfig('performance', 'compressionEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تحديد معدل الطلبات</Label>
                    <p className="text-sm text-muted-foreground">منع الإفراط في الاستخدام</p>
                  </div>
                  <Switch
                    checked={config.performance.rateLimitEnabled}
                    onCheckedChange={(checked) => updateConfig('performance', 'rateLimitEnabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                إعدادات الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emailServer">خادم البريد الإلكتروني</Label>
                  <Input
                    id="emailServer"
                    value={config.notifications.emailServer}
                    onChange={(e) => updateConfig('notifications', 'emailServer', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="adminEmails">بريد المدراء</Label>
                  <Input
                    id="adminEmails"
                    value={config.notifications.adminEmails}
                    onChange={(e) => updateConfig('notifications', 'adminEmails', e.target.value)}
                    placeholder="admin@example.com, admin2@example.com"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>البريد الإلكتروني</Label>
                    <p className="text-sm text-muted-foreground">إشعارات عبر البريد</p>
                  </div>
                  <Switch
                    checked={config.notifications.emailEnabled}
                    onCheckedChange={(checked) => updateConfig('notifications', 'emailEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>الرسائل النصية</Label>
                    <p className="text-sm text-muted-foreground">إشعارات عبر SMS</p>
                  </div>
                  <Switch
                    checked={config.notifications.smsEnabled}
                    onCheckedChange={(checked) => updateConfig('notifications', 'smsEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>الإشعارات الفورية</Label>
                    <p className="text-sm text-muted-foreground">Push notifications</p>
                  </div>
                  <Switch
                    checked={config.notifications.pushEnabled}
                    onCheckedChange={(checked) => updateConfig('notifications', 'pushEnabled', checked)}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button variant="outline" onClick={() => testConnection('البريد الإلكتروني')}>
                  <Mail className="w-4 h-4 mr-2" />
                  اختبار البريد الإلكتروني
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;