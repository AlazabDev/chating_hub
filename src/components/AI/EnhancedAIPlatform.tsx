
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EnhancedChatInterface from './EnhancedChatInterface';
import AIWorkflowManager from './AIWorkflowManager';
import { 
  Brain, 
  Cpu, 
  Bot, 
  MessageSquare, 
  Workflow, 
  BarChart3, 
  Settings,
  Zap,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users
} from 'lucide-react';

interface AIModelStatus {
  deepseek: boolean;
  azureOpenAI: boolean;
}

interface RepositoryStats {
  total: number;
  active: number;
  aiEnabled: number;
  automationEnabled: number;
}

interface ConversationStats {
  total: number;
  today: number;
  thisWeek: number;
}

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
  isCode?: boolean;
  model?: 'deepseek' | 'azure-openai';
  action?: string;
}

interface EnhancedAIPlatformProps {
  onSendMessage: (content: string, model: 'deepseek' | 'azure-openai', context?: any) => Promise<void>;
  messages: ChatMessage[];
  isLoading: boolean;
  modelStatus: AIModelStatus;
}

const EnhancedAIPlatform: React.FC<EnhancedAIPlatformProps> = ({
  onSendMessage,
  messages,
  isLoading,
  modelStatus
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'workflow' | 'analytics'>('chat');
  const [repositoryStats, setRepositoryStats] = useState<RepositoryStats>({
    total: 12,
    active: 8,
    aiEnabled: 6,
    automationEnabled: 4
  });
  const [conversationStats, setConversationStats] = useState<ConversationStats>({
    total: 45,
    today: 8,
    thisWeek: 23
  });
  const [workflowProgress, setWorkflowProgress] = useState(75);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: repos } = await supabase
        .from('repositories')
        .select('status, ai_features_enabled, workflow_automation');

      if (repos && repos.length > 0) {
        const repoStats: RepositoryStats = {
          total: repos.length,
          active: repos.filter(r => r.status === 'active').length,
          aiEnabled: repos.filter(r => r.ai_features_enabled).length,
          automationEnabled: repos.filter(r => r.workflow_automation).length
        };
        setRepositoryStats(repoStats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getModelStatusBadge = (modelName: string, isConnected: boolean) => (
    <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
      <span className="text-white">{modelName}</span>
    </Badge>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header محسن */}
      <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                منصة الذكاء الاصطناعي المتطورة
              </h1>
              <p className="text-gray-300 text-sm lg:text-base">
                إدارة شاملة للتطوير بالذكاء الاصطناعي
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {getModelStatusBadge("DeepSeek", modelStatus.deepseek)}
              {getModelStatusBadge("Azure OpenAI", modelStatus.azureOpenAI)}
            </div>
          </div>
        </div>
      </div>

      {/* إحصائيات سريعة محسنة */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">المستودعات النشطة</p>
                  <p className="text-xl lg:text-2xl font-bold text-blue-400">{repositoryStats.active}</p>
                </div>
                <Bot className="w-6 h-6 lg:w-8 lg:h-8 text-blue-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">محادثات اليوم</p>
                  <p className="text-xl lg:text-2xl font-bold text-purple-400">{conversationStats.today}</p>
                </div>
                <MessageSquare className="w-6 h-6 lg:w-8 lg:h-8 text-purple-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">الأتمتة الممكنة</p>
                  <p className="text-xl lg:text-2xl font-bold text-green-400">{repositoryStats.automationEnabled}</p>
                </div>
                <Zap className="w-6 h-6 lg:w-8 lg:h-8 text-green-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">تقدم المراحل</p>
                  <p className="text-xl lg:text-2xl font-bold text-yellow-400">{Math.round(workflowProgress)}%</p>
                </div>
                <Workflow className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* التبويبات المحسنة */}
        <div className="bg-gray-800/30 rounded-lg border border-gray-700 backdrop-blur">
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
            <div className="border-b border-gray-700">
              <TabsList className="grid w-full grid-cols-3 bg-transparent border-0 h-12">
                <TabsTrigger 
                  value="chat" 
                  className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-600/20 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none border-b-2 border-transparent"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">المساعد الذكي</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="workflow" 
                  className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-600/20 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none border-b-2 border-transparent"
                >
                  <Workflow className="w-4 h-4" />
                  <span className="hidden sm:inline">مراحل العمل</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-600/20 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none border-b-2 border-transparent"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">التحليلات</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 lg:p-6">
              <TabsContent value="chat" className="m-0 h-[600px] lg:h-[700px]">
                <EnhancedChatInterface
                  onSendMessage={onSendMessage}
                  messages={messages}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="workflow" className="m-0 h-[600px] lg:h-[700px] overflow-y-auto">
                <AIWorkflowManager />
              </TabsContent>

              <TabsContent value="analytics" className="m-0 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                  {/* تحليلات الاستخدام */}
                  <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-white text-lg">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        إحصائيات الاستخدام
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">المحادثات الكلية</span>
                        <span className="font-medium text-white">{conversationStats.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">هذا الأسبوع</span>
                        <span className="font-medium text-white">{conversationStats.thisWeek}</span>
                      </div>
                      <div className="pt-2">
                        <Progress value={60} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* حالة المستودعات */}
                  <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-white text-lg">
                        <Bot className="w-5 h-5 text-purple-400" />
                        حالة المستودعات
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">إجمالي المستودعات</span>
                        <span className="font-medium text-white">{repositoryStats.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">AI مفعل</span>
                        <span className="font-medium text-white">{repositoryStats.aiEnabled}</span>
                      </div>
                      <div className="pt-2">
                        <Progress 
                          value={repositoryStats.total > 0 ? (repositoryStats.aiEnabled / repositoryStats.total) * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* تقدم المراحل */}
                  <Card className="bg-gray-800/50 border-gray-700 backdrop-blur lg:col-span-2 xl:col-span-1">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-white text-lg">
                        <Workflow className="w-5 h-5 text-green-400" />
                        تقدم المراحل
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl lg:text-3xl font-bold text-green-400 mb-2">
                          {Math.round(workflowProgress)}%
                        </div>
                        <Progress value={workflowProgress} className="h-3 mb-2" />
                        <p className="text-xs text-gray-400">
                          مراحل العمل المكتملة
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* حالة النماذج */}
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-white text-lg">
                      <Brain className="w-5 h-5 text-blue-400" />
                      حالة نماذج الذكاء الاصطناعي
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg backdrop-blur">
                        <div className="flex items-center gap-3">
                          <Brain className="w-8 h-8 text-blue-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <h3 className="font-semibold text-white">DeepSeek</h3>
                            <p className="text-sm text-gray-400 truncate">النموذج الأساسي</p>
                          </div>
                        </div>
                        {modelStatus.deepseek ? (
                          <Badge variant="default" className="flex items-center gap-1 bg-green-600 text-white">
                            <CheckCircle className="w-3 h-3" />
                            متصل
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            غير متصل
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg backdrop-blur">
                        <div className="flex items-center gap-3">
                          <Cpu className="w-8 h-8 text-blue-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <h3 className="font-semibold text-white">Azure OpenAI</h3>
                            <p className="text-sm text-gray-400 truncate">النموذج المتقدم</p>
                          </div>
                        </div>
                        {modelStatus.azureOpenAI ? (
                          <Badge variant="default" className="flex items-center gap-1 bg-green-600 text-white">
                            <CheckCircle className="w-3 h-3" />
                            متصل
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            غير متصل
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAIPlatform;
