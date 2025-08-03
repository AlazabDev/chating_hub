import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Zap, 
  Brain,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { AIConnectionTester } from './AIConnectionTester';

interface AIModel {
  name: string;
  provider: string;
  status: 'online' | 'offline' | 'maintenance';
  lastUsed: string;
  responseTime: number;
  accuracy: number;
  icon: React.ComponentType<any>;
}

const AIStatusOverview: React.FC = () => {
  const models: AIModel[] = [
    {
      name: 'Claude',
      provider: 'Anthropic',
      status: 'online',
      lastUsed: '2 دقائق',
      responseTime: 1.2,
      accuracy: 98.5,
      icon: Bot
    },
    {
      name: 'DeepSeek',
      provider: 'DeepSeek AI',
      status: 'online',
      lastUsed: '5 دقائق',
      responseTime: 0.8,
      accuracy: 97.2,
      icon: Zap
    },
    {
      name: 'Azure OpenAI',
      provider: 'Microsoft',
      status: 'online',
      lastUsed: '1 ساعة',
      responseTime: 1.5,
      accuracy: 96.8,
      icon: Brain
    }
  ];

  const getStatusColor = (status: AIModel['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: AIModel['status']) => {
    switch (status) {
      case 'online': return 'متصل';
      case 'offline': return 'غير متصل';
      case 'maintenance': return 'صيانة';
      default: return 'غير محدد';
    }
  };

  const getStatusIcon = (status: AIModel['status']) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'maintenance': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Models Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {models.map((model) => {
          const IconComponent = model.icon;
          return (
            <Card key={model.name} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                  </div>
                  <Badge className={`${getStatusColor(model.status)} text-white text-xs`}>
                    {getStatusText(model.status)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{model.provider}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">آخر استخدام</span>
                    <p className="font-medium">منذ {model.lastUsed}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">وقت الاستجابة</span>
                    <p className="font-medium">{model.responseTime}s</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">دقة النموذج</span>
                    <p className="font-medium">{model.accuracy}%</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(model.status)}
                    <span className="text-sm">الحالة</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connection Tester */}
      <AIConnectionTester />

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات الاستخدام اليومية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">إجمالي الاستعلامات</span>
                <span className="text-xl font-bold">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">متوسط وقت الاستجابة</span>
                <span className="text-xl font-bold">1.17s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">معدل النجاح</span>
                <span className="text-xl font-bold text-green-500">98.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">الاستعلامات الفاشلة</span>
                <span className="text-xl font-bold text-red-500">23</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع استخدام النماذج</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <span className="text-sm">Claude</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-sm font-mono">65%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm">DeepSeek</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div className="bg-accent h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <span className="text-sm font-mono">25%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span className="text-sm">Azure OpenAI</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                  <span className="text-sm font-mono">10%</span>
                </div>
              </div>
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
            <Button variant="outline" size="sm">
              <Activity className="w-4 h-4 mr-2" />
              مراقبة الأداء
            </Button>
            <Button variant="outline" size="sm">
              <Bot className="w-4 h-4 mr-2" />
              إعدادات النماذج
            </Button>
            <Button variant="outline" size="sm">
              <Zap className="w-4 h-4 mr-2" />
              تحسين الأداء
            </Button>
            <Button variant="outline" size="sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              تقرير الحالة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIStatusOverview;