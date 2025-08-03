import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Rocket, 
  Server, 
  Activity, 
  Users,
  Database,
  Globe,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeploymentStatus {
  id: string;
  name: string;
  environment: 'development' | 'staging' | 'production';
  status: 'deploying' | 'success' | 'failed' | 'idle';
  progress: number;
  lastDeployed: string;
  version: string;
  branch: string;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  activeUsers: number;
  requestsPerMinute: number;
  uptime: string;
  responseTime: number;
}

const ProductionDashboard: React.FC = () => {
  const { toast } = useToast();
  const [deployments, setDeployments] = useState<DeploymentStatus[]>([
    {
      id: '1',
      name: 'AI Platform Frontend',
      environment: 'production',
      status: 'success',
      progress: 100,
      lastDeployed: '2024-01-15T10:30:00Z',
      version: 'v2.1.0',
      branch: 'main'
    },
    {
      id: '2',
      name: 'AI Platform Backend',
      environment: 'production',
      status: 'success',
      progress: 100,
      lastDeployed: '2024-01-15T10:25:00Z',
      version: 'v2.1.0',
      branch: 'main'
    },
    {
      id: '3',
      name: 'AI Platform Staging',
      environment: 'staging',
      status: 'deploying',
      progress: 75,
      lastDeployed: '2024-01-15T11:00:00Z',
      version: 'v2.2.0-beta',
      branch: 'develop'
    }
  ]);

  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 68,
    disk: 32,
    network: 15,
    activeUsers: 142,
    requestsPerMinute: 2350,
    uptime: '7d 14h 23m',
    responseTime: 1.2
  });

  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    // محاكاة تحديث البيانات
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 5)),
        requestsPerMinute: Math.floor(prev.requestsPerMinute + (Math.random() - 0.5) * 200),
        responseTime: Math.max(0.1, prev.responseTime + (Math.random() - 0.5) * 0.2)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const triggerDeployment = async (deploymentId: string) => {
    setIsDeploying(true);
    
    setDeployments(prev => prev.map(dep => 
      dep.id === deploymentId 
        ? { ...dep, status: 'deploying', progress: 0 }
        : dep
    ));

    // محاكاة عملية النشر
    const progressInterval = setInterval(() => {
      setDeployments(prev => prev.map(dep => {
        if (dep.id === deploymentId && dep.status === 'deploying') {
          const newProgress = Math.min(100, dep.progress + 10);
          if (newProgress === 100) {
            return {
              ...dep,
              status: 'success',
              progress: 100,
              lastDeployed: new Date().toISOString(),
              version: `v${parseInt(dep.version.split('.')[0].substring(1)) + 1}.0.0`
            };
          }
          return { ...dep, progress: newProgress };
        }
        return dep;
      }));
    }, 500);

    setTimeout(() => {
      clearInterval(progressInterval);
      setIsDeploying(false);
      toast({
        title: "تم النشر بنجاح",
        description: "تم نشر التطبيق على البيئة المطلوبة"
      });
    }, 5000);
  };

  const getStatusColor = (status: DeploymentStatus['status']) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'deploying': return 'bg-blue-500';
      case 'idle': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: DeploymentStatus['status']) => {
    switch (status) {
      case 'success': return 'نشط';
      case 'failed': return 'فشل';
      case 'deploying': return 'جاري النشر';
      case 'idle': return 'معطل';
      default: return 'غير محدد';
    }
  };

  const getEnvironmentColor = (env: DeploymentStatus['environment']) => {
    switch (env) {
      case 'production': return 'bg-red-500';
      case 'staging': return 'bg-yellow-500';
      case 'development': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">لوحة الإنتاج</h2>
          <p className="text-muted-foreground">مراقبة ونشر التطبيقات</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            <Activity className="w-4 h-4 mr-2" />
            تحديث
          </Button>
          <Button
            onClick={() => triggerDeployment('1')}
            disabled={isDeploying}
          >
            <Rocket className="w-4 h-4 mr-2" />
            نشر جديد
          </Button>
        </div>
      </div>

      <Tabs defaultValue="deployments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deployments">النشر</TabsTrigger>
          <TabsTrigger value="monitoring">المراقبة</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
        </TabsList>

        <TabsContent value="deployments" className="space-y-4">
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">البيئات النشطة</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+1</span> منذ الأمس
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المستخدمون النشطون</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+12%</span> من الأمس
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الطلبات/دقيقة</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.requestsPerMinute.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-blue-500">متوسط</span> آخر ساعة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">وقت الاستجابة</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.responseTime.toFixed(1)}s</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">-0.2s</span> من الأمس
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Deployments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {deployments.map((deployment) => (
              <Card key={deployment.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{deployment.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={`${getEnvironmentColor(deployment.environment)} text-white text-xs`}>
                        {deployment.environment}
                      </Badge>
                      <Badge className={`${getStatusColor(deployment.status)} text-white text-xs`}>
                        {getStatusText(deployment.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>الإصدار:</span>
                      <span className="font-mono">{deployment.version}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>الفرع:</span>
                      <span className="font-mono">{deployment.branch}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>آخر نشر:</span>
                      <span>{formatTimeAgo(deployment.lastDeployed)}</span>
                    </div>
                  </div>

                  {deployment.status === 'deploying' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>التقدم:</span>
                        <span>{deployment.progress}%</span>
                      </div>
                      <Progress value={deployment.progress} className="h-2" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triggerDeployment(deployment.id)}
                      disabled={deployment.status === 'deploying'}
                      className="flex-1"
                    >
                      <Rocket className="w-3 h-3 mr-1" />
                      {deployment.status === 'deploying' ? 'جاري النشر...' : 'نشر'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      عرض
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          {/* System Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أداء النظام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">المعالج (CPU)</span>
                    <span className="text-sm font-mono">{metrics.cpu.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.cpu} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">الذاكرة (RAM)</span>
                    <span className="text-sm font-mono">{metrics.memory.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.memory} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">القرص الصلب</span>
                    <span className="text-sm font-mono">{metrics.disk.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.disk} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">الشبكة</span>
                    <span className="text-sm font-mono">{metrics.network.toFixed(1)} Mbps</span>
                  </div>
                  <Progress value={metrics.network} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معلومات النظام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">وقت التشغيل</span>
                  </div>
                  <span className="text-sm font-mono">{metrics.uptime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">المستخدمون النشطون</span>
                  </div>
                  <span className="text-sm font-mono">{metrics.activeUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">الطلبات/دقيقة</span>
                  </div>
                  <span className="text-sm font-mono">{metrics.requestsPerMinute.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">متوسط الاستجابة</span>
                  </div>
                  <span className="text-sm font-mono">{metrics.responseTime.toFixed(2)}s</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  حالة الأمان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">شهادة SSL</span>
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      صالحة
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">جدار الحماية</span>
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      نشط
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">نسخ احتياطية</span>
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      آخر: 2 ساعات
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">مراقبة الغزو</span>
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      نشط
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>التحديثات الأمنية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">نظام التشغيل</span>
                    <Badge variant="default" className="bg-green-500">محدث</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">المكتبات</span>
                    <Badge variant="default" className="bg-green-500">محدث</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">قاعدة البيانات</span>
                    <Badge variant="secondary">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      تحديث متاح
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الوصول والمصادقة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">محاولات دخول فاشلة</span>
                    <span className="text-sm font-mono">3 آخر 24 ساعة</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">جلسات نشطة</span>
                    <span className="text-sm font-mono">142</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">مستخدمون بـ 2FA</span>
                    <span className="text-sm font-mono">89%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductionDashboard;