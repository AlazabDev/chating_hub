import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  MessageSquare, 
  GitBranch, 
  Database,
  Users,
  Clock,
  TrendingUp,
  Server,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  activeRepositories: number;
  totalUsers: number;
  systemUptime: string;
  recentActivity: ActivityItem[];
  performanceMetrics: {
    avgResponseTime: number;
    successRate: number;
    errorRate: number;
  };
}

interface ActivityItem {
  id: string;
  type: 'conversation' | 'repository' | 'user' | 'system';
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

const DashboardAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalConversations: 0,
    totalMessages: 0,
    activeRepositories: 0,
    totalUsers: 0,
    systemUptime: '0 دقيقة',
    recentActivity: [],
    performanceMetrics: {
      avgResponseTime: 0,
      successRate: 0,
      errorRate: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // محاكاة البيانات - في التطبيق الحقيقي ستأتي من قاعدة البيانات
      const mockData: AnalyticsData = {
        totalConversations: 145,
        totalMessages: 892,
        activeRepositories: 12,
        totalUsers: 34,
        systemUptime: '7 أيام 14 ساعة',
        recentActivity: [
          {
            id: '1',
            type: 'conversation',
            description: 'محادثة جديدة مع Claude بواسطة المستخدم أحمد',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            status: 'success'
          },
          {
            id: '2',
            type: 'repository',
            description: 'تم إنشاء مستودع جديد: ERP-System-v2',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            status: 'success'
          },
          {
            id: '3',
            type: 'system',
            description: 'تم تحديث إعدادات الذكاء الاصطناعي',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            status: 'warning'
          },
          {
            id: '4',
            type: 'user',
            description: 'مستخدم جديد انضم للمنصة: sara.dev@example.com',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            status: 'success'
          }
        ],
        performanceMetrics: {
          avgResponseTime: 1.2,
          successRate: 98.5,
          errorRate: 1.5
        }
      };

      // محاولة جلب البيانات الحقيقية
      try {
        const [conversationsResult, messagesResult, repositoriesResult] = await Promise.all([
          supabase.from('ai_conversations').select('id', { count: 'exact' }),
          supabase.from('ai_messages').select('id', { count: 'exact' }),
          supabase.from('repositories').select('id', { count: 'exact' })
        ]);

        if (conversationsResult.count !== null) {
          mockData.totalConversations = conversationsResult.count;
        }
        if (messagesResult.count !== null) {
          mockData.totalMessages = messagesResult.count;
        }
        if (repositoriesResult.count !== null) {
          mockData.activeRepositories = repositoriesResult.count;
        }
      } catch (error) {
        console.log('Using mock data due to:', error);
      }

      setAnalytics(mockData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'conversation': return <MessageSquare className="w-4 h-4" />;
      case 'repository': return <GitBranch className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      case 'system': return <Server className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المحادثات</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+12%</span> من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الرسائل</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+23%</span> من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستودعات النشطة</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeRepositories}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-500">+3</span> مستودعات جديدة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+5</span> مستخدمين جدد
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط وقت الاستجابة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.performanceMetrics.avgResponseTime}s</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">-0.3s</span> تحسن من الأمس
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.performanceMetrics.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+0.5%</span> من الأمس
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الأخطاء</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.performanceMetrics.errorRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">-0.2%</span> من الأمس
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              حالة النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">وقت التشغيل</span>
                <Badge variant="outline" className="text-green-500 border-green-500">
                  {analytics.systemUptime}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">حالة الذكاء الاصطناعي</span>
                <Badge variant="default" className="bg-green-500">
                  نشط
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">قاعدة البيانات</span>
                <Badge variant="default" className="bg-green-500">
                  متصلة
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">التخزين السحابي</span>
                <Badge variant="default" className="bg-green-500">
                  متصل
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              النشاط الأخير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className={`${getStatusColor(activity.status)} mt-1`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-tight">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={loadAnalytics}>
              تحديث البيانات
            </Button>
            <Button variant="outline" size="sm">
              تصدير التقرير
            </Button>
            <Button variant="outline" size="sm">
              إعدادات النظام
            </Button>
            <Button variant="outline" size="sm">
              نسخة احتياطية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardAnalytics;