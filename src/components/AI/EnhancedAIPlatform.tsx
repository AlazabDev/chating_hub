
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
      {modelName}
    </Badge>
  );

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header مع المعلومات الأساسية */}
      <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-blue-900/20 via-transparent to-purple-900/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              منصة الذكاء الاصطناعي المتطورة
            </h1>
            <p className="text-gray-300 mt-1">
              إدارة شاملة للتطوير بالذكاء الاصطناعي
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getModelStatusBadge("DeepSeek", modelStatus.deepseek)}
            {getModelStatusBadge("Azure OpenAI", modelStatus.azureOpenAI)}
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">المستودعات النشطة</p>
                  <p className="text-2xl font-bold text-blue-400">{repositoryStats.active}</p>
                </div>
                <Bot className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">محادثات اليوم</p>
                  <p className="text-2xl font-bold text-purple-400">{conversationStats.today}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">الأتمتة الممكنة</p>
                  <p className="text-2xl font-bold text-green-400">{repositoryStats.automationEnabled}</p>
                </div>
                <Zap className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">تقدم المراحل</p>
                  <p className="text-2xl font-bold text-yellow-400">{Math.round(workflowProgress)}%</p>
                </div>
                <Workflow className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* التبويبات الرئيسية */}
      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-6 mt-4 bg-gray-800 border-gray-700">
            <TabsTrigger value="chat" className="flex items-center gap-2 text-white data-[state=active]:bg-blue-600">
              <MessageSquare className="w-4 h-4" />
              المساعد الذكي
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-2 text-white data-[state=active]:bg-blue-600">
              <Workflow className="w-4 h-4" />
              مراحل العمل
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 text-white data-[state=active]:bg-blue-600">
              <BarChart3 className="w-4 h-4" />
              التحليلات
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 p-6">
            <TabsContent value="chat" className="h-full m-0">
              <EnhancedChatInterface
                onSendMessage={onSendMessage}
                messages={messages}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="workflow" className="h-full m-0">
              <AIWorkflowManager />
            </TabsContent>

            <TabsContent value="analytics" className="h-full m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* تحليلات الاستخدام */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                      إحصائيات الاستخدام
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">المحادثات الكلية</span>
                        <span className="font-medium text-white">{conversationStats.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">هذا الأسبوع</span>
                        <span className="font-medium text-white">{conversationStats.thisWeek}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* حالة المستودعات */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Bot className="w-5 h-5 text-purple-400" />
                      حالة المستودعات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">إجمالي المستودعات</span>
                        <span className="font-medium text-white">{repositoryStats.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">AI مفعل</span>
                        <span className="font-medium text-white">{repositoryStats.aiEnabled}</span>
                      </div>
                      <Progress 
                        value={repositoryStats.total > 0 ? (repositoryStats.aiEnabled / repositoryStats.total) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* تقدم المراحل */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Workflow className="w-5 h-5 text-green-400" />
                      تقدم المراحل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400 mb-2">
                        {Math.round(workflowProgress)}%
                      </div>
                      <Progress value={workflowProgress} className="h-3" />
                      <p className="text-xs text-gray-400 mt-2">
                        مراحل العمل المكتملة
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* حالة النماذج */}
                <Card className="bg-gray-800 border-gray-700 md:col-span-2 lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Brain className="w-5 h-5 text-blue-400" />
                      حالة نماذج الذكاء الاصطناعي
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Brain className="w-8 h-8 text-blue-400" />
                          <div>
                            <h3 className="font-semibold text-white">DeepSeek</h3>
                            <p className="text-sm text-gray-400">النموذج الأساسي</p>
                          </div>
                        </div>
                        {modelStatus.deepseek ? (
                          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
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

                      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Cpu className="w-8 h-8 text-blue-400" />
                          <div>
                            <h3 className="font-semibold text-white">Azure OpenAI</h3>
                            <p className="text-sm text-gray-400">النموذج المتقدم</p>
                          </div>
                        </div>
                        {modelStatus.azureOpenAI ? (
                          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
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
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedAIPlatform;
