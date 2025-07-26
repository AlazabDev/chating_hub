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
    total: 0,
    active: 0,
    aiEnabled: 0,
    automationEnabled: 0
  });
  const [conversationStats, setConversationStats] = useState<ConversationStats>({
    total: 0,
    today: 0,
    thisWeek: 0
  });
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // إحصائيات المستودعات
      const { data: repos, error: reposError } = await supabase
        .from('repositories')
        .select('status, ai_features_enabled, workflow_automation');

      if (reposError) throw reposError;

      const repoStats: RepositoryStats = {
        total: repos?.length || 0,
        active: repos?.filter(r => r.status === 'active').length || 0,
        aiEnabled: repos?.filter(r => r.ai_features_enabled).length || 0,
        automationEnabled: repos?.filter(r => r.workflow_automation).length || 0
      };

      setRepositoryStats(repoStats);

      // إحصائيات المحادثات
      const { data: conversations, error: convError } = await supabase
        .from('ai_conversations')
        .select('created_at');

      if (convError) throw convError;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const convStats: ConversationStats = {
        total: conversations?.length || 0,
        today: conversations?.filter(c => new Date(c.created_at) >= today).length || 0,
        thisWeek: conversations?.filter(c => new Date(c.created_at) >= weekAgo).length || 0
      };

      setConversationStats(convStats);

      // تقدم مراحل العمل
      const { data: stages, error: stagesError } = await supabase
        .from('ai_workflow_stages')
        .select('status');

      if (stagesError) throw stagesError;

      if (stages && stages.length > 0) {
        const completedStages = stages.filter(s => s.status === 'completed').length;
        setWorkflowProgress((completedStages / stages.length) * 100);
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
    <div className="h-full flex flex-col bg-background">
      {/* Header مع المعلومات الأساسية */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              منصة الذكاء الاصطناعي المتطورة
            </h1>
            <p className="text-muted-foreground mt-1">
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
          <Card className="bg-white/5 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">المستودعات النشطة</p>
                  <p className="text-2xl font-bold text-primary">{repositoryStats.active}</p>
                </div>
                <Bot className="w-8 h-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">محادثات اليوم</p>
                  <p className="text-2xl font-bold text-accent">{conversationStats.today}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-accent/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">الأتمتة الممكنة</p>
                  <p className="text-2xl font-bold text-green-500">{repositoryStats.automationEnabled}</p>
                </div>
                <Zap className="w-8 h-8 text-green-500/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">تقدم المراحل</p>
                  <p className="text-2xl font-bold text-blue-500">{Math.round(workflowProgress)}%</p>
                </div>
                <Workflow className="w-8 h-8 text-blue-500/60" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* التبويبات الرئيسية */}
      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              المساعد الذكي
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              مراحل العمل
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
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
                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      إحصائيات الاستخدام
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>المحادثات الكلية</span>
                        <span className="font-medium">{conversationStats.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>هذا الأسبوع</span>
                        <span className="font-medium">{conversationStats.thisWeek}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* حالة المستودعات */}
                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-accent" />
                      حالة المستودعات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>إجمالي المستودعات</span>
                        <span className="font-medium">{repositoryStats.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>AI مفعل</span>
                        <span className="font-medium">{repositoryStats.aiEnabled}</span>
                      </div>
                      <Progress 
                        value={repositoryStats.total > 0 ? (repositoryStats.aiEnabled / repositoryStats.total) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* تقدم المراحل */}
                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Workflow className="w-5 h-5 text-green-500" />
                      تقدم المراحل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-500 mb-2">
                        {Math.round(workflowProgress)}%
                      </div>
                      <Progress value={workflowProgress} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-2">
                        مراحل العمل المكتملة
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* حالة النماذج */}
                <Card className="bg-gradient-card border-border md:col-span-2 lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      حالة نماذج الذكاء الاصطناعي
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Brain className="w-8 h-8 text-primary" />
                          <div>
                            <h3 className="font-semibold">DeepSeek</h3>
                            <p className="text-sm text-muted-foreground">النموذج الأساسي</p>
                          </div>
                        </div>
                        {modelStatus.deepseek ? (
                          <Badge variant="default" className="flex items-center gap-1">
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

                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Cpu className="w-8 h-8 text-blue-500" />
                          <div>
                            <h3 className="font-semibold">Azure OpenAI</h3>
                            <p className="text-sm text-muted-foreground">النموذج المتقدم</p>
                          </div>
                        </div>
                        {modelStatus.azureOpenAI ? (
                          <Badge variant="default" className="flex items-center gap-1">
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