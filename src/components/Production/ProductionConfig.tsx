import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Server,
  Database,
  Shield,
  Globe,
  Settings,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Terminal,
  Monitor
} from 'lucide-react';

interface ProductionSettings {
  serverConfig: {
    host: string;
    port: number;
    ssl: boolean;
    domain: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
    ssl: boolean;
  };
  security: {
    cors: string[];
    rateLimit: number;
    jwtSecret: string;
    encryptionKey: string;
  };
  performance: {
    cacheEnabled: boolean;
    compressionEnabled: boolean;
    maxConnections: number;
    timeout: number;
  };
}

export const ProductionConfig: React.FC = () => {
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  
  const [settings, setSettings] = useState<ProductionSettings>({
    serverConfig: {
      host: '0.0.0.0',
      port: 3000,
      ssl: true,
      domain: ''
    },
    database: {
      host: 'localhost',
      port: 5432,
      name: 'deepsec_erp',
      username: '',
      password: '',
      ssl: true
    },
    security: {
      cors: ['https://yourdomain.com'],
      rateLimit: 100,
      jwtSecret: '',
      encryptionKey: ''
    },
    performance: {
      cacheEnabled: true,
      compressionEnabled: true,
      maxConnections: 100,
      timeout: 30000
    }
  });

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploymentLogs([]);
    
    const deploySteps = [
      'جاري فحص الإعدادات...',
      'جاري إنشاء ملفات الإنتاج...',
      'جاري تجهيز قاعدة البيانات...',
      'جاري رفع الملفات للسيرفر...',
      'جاري تشغيل الخدمات...',
      'جاري اختبار الاتصالات...',
      'تم النشر بنجاح!'
    ];

    for (let i = 0; i < deploySteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setDeploymentLogs(prev => [...prev, deploySteps[i]]);
    }

    setIsDeploying(false);
    toast({
      title: "تم النشر بنجاح",
      description: "تم نشر التطبيق على الإنتاج بنجاح"
    });
  };

  const generateDockerfile = () => {
    const dockerfile = `# DeepSec Pilot Production Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE ${settings.serverConfig.port}

# Start the application
CMD ["npm", "start"]
`;

    const blob = new Blob([dockerfile], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Dockerfile';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "تم التحميل",
      description: "تم تحميل ملف Dockerfile"
    });
  };

  const generateNginxConfig = () => {
    const nginxConfig = `server {
    listen 80;
    server_name ${settings.serverConfig.domain};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${settings.serverConfig.domain};

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:${settings.serverConfig.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}`;

    const blob = new Blob([nginxConfig], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nginx.conf';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "تم التحميل",
      description: "تم تحميل ملف إعدادات Nginx"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إعدادات الإنتاج</h2>
          <p className="text-muted-foreground">تجهيز ونشر التطبيق على السيرفر</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateDockerfile}>
            <Download className="w-4 h-4 mr-2" />
            Dockerfile
          </Button>
          <Button variant="outline" onClick={generateNginxConfig}>
            <Download className="w-4 h-4 mr-2" />
            Nginx Config
          </Button>
        </div>
      </div>

      <Tabs defaultValue="server" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="server">
            <Server className="w-4 h-4 mr-2" />
            السيرفر
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="w-4 h-4 mr-2" />
            قاعدة البيانات
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            الأمان
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Monitor className="w-4 h-4 mr-2" />
            الأداء
          </TabsTrigger>
        </TabsList>

        <TabsContent value="server" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات السيرفر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="host">عنوان الخادم</Label>
                  <Input
                    id="host"
                    value={settings.serverConfig.host}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      serverConfig: { ...prev.serverConfig, host: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="port">المنفذ</Label>
                  <Input
                    id="port"
                    type="number"
                    value={settings.serverConfig.port}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      serverConfig: { ...prev.serverConfig, port: parseInt(e.target.value) }
                    }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="domain">النطاق</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={settings.serverConfig.domain}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    serverConfig: { ...prev.serverConfig, domain: e.target.value }
                  }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ssl"
                  checked={settings.serverConfig.ssl}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    serverConfig: { ...prev.serverConfig, ssl: checked }
                  }))}
                />
                <Label htmlFor="ssl">تفعيل SSL</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات قاعدة البيانات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="db-host">عنوان قاعدة البيانات</Label>
                  <Input
                    id="db-host"
                    value={settings.database.host}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      database: { ...prev.database, host: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="db-port">المنفذ</Label>
                  <Input
                    id="db-port"
                    type="number"
                    value={settings.database.port}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      database: { ...prev.database, port: parseInt(e.target.value) }
                    }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="db-name">اسم قاعدة البيانات</Label>
                <Input
                  id="db-name"
                  value={settings.database.name}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    database: { ...prev.database, name: e.target.value }
                  }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="db-username">اسم المستخدم</Label>
                  <Input
                    id="db-username"
                    value={settings.database.username}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      database: { ...prev.database, username: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="db-password">كلمة المرور</Label>
                  <Input
                    id="db-password"
                    type="password"
                    value={settings.database.password}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      database: { ...prev.database, password: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الأمان</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cors">النطاقات المسموحة (CORS)</Label>
                <Textarea
                  id="cors"
                  placeholder="https://example.com"
                  value={settings.security.cors.join('\n')}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, cors: e.target.value.split('\n') }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="rate-limit">حد الطلبات (في الدقيقة)</Label>
                <Input
                  id="rate-limit"
                  type="number"
                  value={settings.security.rateLimit}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, rateLimit: parseInt(e.target.value) }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="jwt-secret">مفتاح JWT</Label>
                <Input
                  id="jwt-secret"
                  type="password"
                  value={settings.security.jwtSecret}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, jwtSecret: e.target.value }
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الأداء</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="cache">تفعيل التخزين المؤقت</Label>
                  <p className="text-sm text-muted-foreground">يحسن سرعة الاستجابة</p>
                </div>
                <Switch
                  id="cache"
                  checked={settings.performance.cacheEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    performance: { ...prev.performance, cacheEnabled: checked }
                  }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compression">تفعيل الضغط</Label>
                  <p className="text-sm text-muted-foreground">يقلل حجم البيانات المرسلة</p>
                </div>
                <Switch
                  id="compression"
                  checked={settings.performance.compressionEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    performance: { ...prev.performance, compressionEnabled: checked }
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="max-connections">الحد الأقصى للاتصالات</Label>
                <Input
                  id="max-connections"
                  type="number"
                  value={settings.performance.maxConnections}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    performance: { ...prev.performance, maxConnections: parseInt(e.target.value) }
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deployment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            نشر التطبيق
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-card rounded-lg border">
            <div>
              <h3 className="font-semibold">جاهز للنشر</h3>
              <p className="text-sm text-muted-foreground">
                تأكد من صحة جميع الإعدادات قبل النشر
              </p>
            </div>
            <Button 
              onClick={handleDeploy}
              disabled={isDeploying}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isDeploying ? (
                <>
                  <Terminal className="w-4 h-4 mr-2 animate-spin" />
                  جاري النشر...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  نشر على الإنتاج
                </>
              )}
            </Button>
          </div>

          {deploymentLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">سجل النشر</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {deploymentLogs.map((log, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    {log}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};