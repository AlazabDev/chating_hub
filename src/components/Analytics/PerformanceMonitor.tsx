import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  Cpu, 
  Database, 
  HardDrive, 
  Network, 
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    inbound: number;
    outbound: number;
    latency: number;
  };
  database: {
    connections: number;
    queries_per_second: number;
    cache_hit_ratio: number;
  };
  uptime: number;
  timestamp: string;
}

interface PerformanceAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'database';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const { toast } = useToast();

  // Simulate real system metrics (in production, this would come from your backend)
  const generateMetrics = useCallback((): SystemMetrics => {
    const baseMetrics = {
      cpu: {
        usage: Math.random() * 100,
        cores: 8,
        temperature: 35 + Math.random() * 30
      },
      memory: {
        used: 4 + Math.random() * 8,
        total: 16,
        percentage: 0
      },
      disk: {
        used: 120 + Math.random() * 100,
        total: 500,
        percentage: 0
      },
      network: {
        inbound: Math.random() * 1000,
        outbound: Math.random() * 500,
        latency: 10 + Math.random() * 50
      },
      database: {
        connections: Math.floor(Math.random() * 100),
        queries_per_second: Math.floor(Math.random() * 1000),
        cache_hit_ratio: 85 + Math.random() * 15
      },
      uptime: Date.now() - (Math.random() * 86400000 * 7), // Random uptime up to 7 days
      timestamp: new Date().toISOString()
    };

    baseMetrics.memory.percentage = (baseMetrics.memory.used / baseMetrics.memory.total) * 100;
    baseMetrics.disk.percentage = (baseMetrics.disk.used / baseMetrics.disk.total) * 100;

    return baseMetrics;
  }, []);

  const checkAlerts = useCallback((metrics: SystemMetrics): PerformanceAlert[] => {
    const newAlerts: PerformanceAlert[] = [];
    const timestamp = new Date().toISOString();

    // CPU alerts
    if (metrics.cpu.usage > 90) {
      newAlerts.push({
        id: `cpu-${Date.now()}`,
        type: 'cpu',
        severity: 'critical',
        message: 'استخدام المعالج مرتفع جداً',
        value: metrics.cpu.usage,
        threshold: 90,
        timestamp
      });
    } else if (metrics.cpu.usage > 75) {
      newAlerts.push({
        id: `cpu-${Date.now()}`,
        type: 'cpu',
        severity: 'high',
        message: 'استخدام المعالج مرتفع',
        value: metrics.cpu.usage,
        threshold: 75,
        timestamp
      });
    }

    // Memory alerts
    if (metrics.memory.percentage > 90) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: 'memory',
        severity: 'critical',
        message: 'الذاكرة ممتلئة تقريباً',
        value: metrics.memory.percentage,
        threshold: 90,
        timestamp
      });
    } else if (metrics.memory.percentage > 80) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: 'memory',
        severity: 'high',
        message: 'استخدام الذاكرة مرتفع',
        value: metrics.memory.percentage,
        threshold: 80,
        timestamp
      });
    }

    // Disk alerts
    if (metrics.disk.percentage > 95) {
      newAlerts.push({
        id: `disk-${Date.now()}`,
        type: 'disk',
        severity: 'critical',
        message: 'مساحة القرص ممتلئة تقريباً',
        value: metrics.disk.percentage,
        threshold: 95,
        timestamp
      });
    } else if (metrics.disk.percentage > 85) {
      newAlerts.push({
        id: `disk-${Date.now()}`,
        type: 'disk',
        severity: 'high',
        message: 'مساحة القرص منخفضة',
        value: metrics.disk.percentage,
        threshold: 85,
        timestamp
      });
    }

    // Network latency alerts
    if (metrics.network.latency > 200) {
      newAlerts.push({
        id: `network-${Date.now()}`,
        type: 'network',
        severity: 'high',
        message: 'زمن الاستجابة مرتفع',
        value: metrics.network.latency,
        threshold: 200,
        timestamp
      });
    }

    // Database alerts
    if (metrics.database.cache_hit_ratio < 70) {
      newAlerts.push({
        id: `db-${Date.now()}`,
        type: 'database',
        severity: 'medium',
        message: 'نسبة إصابة التخزين المؤقت منخفضة',
        value: metrics.database.cache_hit_ratio,
        threshold: 70,
        timestamp
      });
    }

    return newAlerts;
  }, []);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    const interval = setInterval(() => {
      const newMetrics = generateMetrics();
      setMetrics(newMetrics);
      setLastUpdate(new Date());

      const newAlerts = checkAlerts(newMetrics);
      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev.slice(0, 19)]); // Keep last 20 alerts
        
        // Show toast for critical alerts
        const criticalAlerts = newAlerts.filter(a => a.severity === 'critical');
        if (criticalAlerts.length > 0) {
          toast({
            title: "تحذير أداء حرج",
            description: criticalAlerts[0].message,
            variant: "destructive"
          });
        }
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [generateMetrics, checkAlerts, refreshInterval, toast]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      const cleanup = startMonitoring();
      return cleanup;
    }
  }, [isMonitoring, startMonitoring]);

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor((Date.now() - uptime) / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days} يوم، ${hours} ساعة`;
    if (hours > 0) return `${hours} ساعة، ${minutes} دقيقة`;
    return `${minutes} دقيقة`;
  };

  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return { color: 'text-green-500', status: 'ممتاز' };
    if (value <= thresholds.warning) return { color: 'text-yellow-500', status: 'متوسط' };
    return { color: 'text-red-500', status: 'ضعيف' };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-blue-500 bg-blue-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">مراقب الأداء</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isMonitoring ? 'المراقبة نشطة' : 'المراقبة متوقفة'}
                  {lastUpdate && ` • آخر تحديث: ${lastUpdate.toLocaleTimeString('ar-SA')}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={isMonitoring ? "destructive" : "default"}
                onClick={isMonitoring ? stopMonitoring : () => setIsMonitoring(true)}
                className="flex items-center gap-2"
              >
                {isMonitoring ? (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    إيقاف المراقبة
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    بدء المراقبة
                  </>
                )}
              </Button>
              
              {metrics && (
                <Button variant="outline" onClick={() => setMetrics(generateMetrics())}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {metrics && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="detailed">تفصيلي</TabsTrigger>
            <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
            <TabsTrigger value="history">التاريخ</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CPU Card */}
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-sm">المعالج</span>
                    </div>
                    <Badge className={getPerformanceStatus(metrics.cpu.usage, { good: 50, warning: 75 }).color}>
                      {getPerformanceStatus(metrics.cpu.usage, { good: 50, warning: 75 }).status}
                    </Badge>
                  </div>
                  <Progress value={metrics.cpu.usage} className="mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{metrics.cpu.usage.toFixed(1)}%</span>
                    <span>{metrics.cpu.cores} أنوية</span>
                  </div>
                </CardContent>
              </Card>

              {/* Memory Card */}
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-sm">الذاكرة</span>
                    </div>
                    <Badge className={getPerformanceStatus(metrics.memory.percentage, { good: 60, warning: 80 }).color}>
                      {getPerformanceStatus(metrics.memory.percentage, { good: 60, warning: 80 }).status}
                    </Badge>
                  </div>
                  <Progress value={metrics.memory.percentage} className="mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{metrics.memory.percentage.toFixed(1)}%</span>
                    <span>{metrics.memory.used.toFixed(1)}/{metrics.memory.total} GB</span>
                  </div>
                </CardContent>
              </Card>

              {/* Disk Card */}
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-purple-500" />
                      <span className="font-medium text-sm">القرص</span>
                    </div>
                    <Badge className={getPerformanceStatus(metrics.disk.percentage, { good: 70, warning: 85 }).color}>
                      {getPerformanceStatus(metrics.disk.percentage, { good: 70, warning: 85 }).status}
                    </Badge>
                  </div>
                  <Progress value={metrics.disk.percentage} className="mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{metrics.disk.percentage.toFixed(1)}%</span>
                    <span>{metrics.disk.used.toFixed(0)}/{metrics.disk.total} GB</span>
                  </div>
                </CardContent>
              </Card>

              {/* Network Card */}
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-orange-500" />
                      <span className="font-medium text-sm">الشبكة</span>
                    </div>
                    <Badge className={getPerformanceStatus(metrics.network.latency, { good: 50, warning: 100 }).color}>
                      {metrics.network.latency.toFixed(0)} ms
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">الوارد</span>
                      <span className="font-mono">{metrics.network.inbound.toFixed(1)} MB/s</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">الصادر</span>
                      <span className="font-mono">{metrics.network.outbound.toFixed(1)} MB/s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  معلومات النظام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">وقت التشغيل</span>
                    </div>
                    <p className="text-2xl font-bold">{formatUptime(metrics.uptime)}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">قاعدة البيانات</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">{metrics.database.connections} اتصال نشط</p>
                      <p className="text-sm">{metrics.database.queries_per_second} استعلام/ثانية</p>
                      <p className="text-sm">نسبة التخزين المؤقت: {metrics.database.cache_hit_ratio.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">حالة الأداء</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm">النظام يعمل بشكل طبيعي</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        آخر فحص: {new Date(metrics.timestamp).toLocaleTimeString('ar-SA')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts */}
          <TabsContent value="alerts" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    تنبيهات الأداء ({alerts.length})
                  </CardTitle>
                  {alerts.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setAlerts([])}>
                      مسح جميع التنبيهات
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد تنبيهات حالياً</p>
                    <p className="text-sm">النظام يعمل بشكل طبيعي</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {alert.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm mb-1">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">
                              القيمة: {alert.value.toFixed(1)} | الحد المسموح: {alert.threshold}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleTimeString('ar-SA')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default PerformanceMonitor;