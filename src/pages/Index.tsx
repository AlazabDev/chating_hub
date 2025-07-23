import React, { useState, useEffect } from 'react';
import { ChatInterface, ChatMessage } from '@/components/Chat/ChatInterface';
import { ProjectSidebar } from '@/components/Sidebar/ProjectSidebar';
import { AppHeader } from '@/components/Header/AppHeader';
import { AIService, AIServiceConfig } from '@/services/aiService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Key, Server, Database } from 'lucide-react';

const Index = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'ar' | 'en'>('ar');
  const [aiService, setAiService] = useState<AIService | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    deepseek: false,
    azureOpenAI: false,
    server: false
  });

  // إعدادات API
  const [apiSettings, setApiSettings] = useState({
    deepseekApiKey: '',
    azureEndpoint: '',
    azureApiKey: '',
    azureDeploymentName: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    // تحميل الإعدادات المحفوظة
    const savedSettings = localStorage.getItem('deepsec-pilot-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setApiSettings(settings);
      initializeAIService(settings);
    } else {
      setShowSettings(true);
    }
  }, []);

  const initializeAIService = async (settings: typeof apiSettings) => {
    const config: AIServiceConfig = {};
    
    if (settings.deepseekApiKey) {
      config.deepseekApiKey = settings.deepseekApiKey;
    }
    
    if (settings.azureEndpoint && settings.azureApiKey && settings.azureDeploymentName) {
      config.azureOpenAIConfig = {
        endpoint: settings.azureEndpoint,
        apiKey: settings.azureApiKey,
        deploymentName: settings.azureDeploymentName
      };
    }

    const service = new AIService(config);
    setAiService(service);

    // اختبار الاتصالات
    const connections = { ...connectionStatus };
    
    if (config.deepseekApiKey) {
      connections.deepseek = await service.testConnection('deepseek');
    }
    
    if (config.azureOpenAIConfig) {
      connections.azureOpenAI = await service.testConnection('azure-openai');
    }
    
    connections.server = true; // سيتم تحديثه حسب حالة السيرفر الفعلية
    
    setConnectionStatus(connections);
  };

  const handleSendMessage = async (content: string, model: 'deepseek' | 'azure-openai') => {
    if (!aiService) {
      toast({
        title: "خطأ في الإعداد",
        description: "يرجى تكوين إعدادات API أولاً",
        variant: "destructive"
      });
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '_user',
      content,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await aiService.sendMessage(content, model);
      
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '_ai',
        content: response.content,
        type: 'ai',
        model: response.model,
        timestamp: new Date(),
        isCode: response.content.includes('```'),
        action: response.action?.type
      };

      setMessages(prev => [...prev, aiMessage]);

      // تنفيذ الإجراءات إذا كانت متوفرة
      if (response.action) {
        await handleAIAction(response.action);
      }

    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIAction = async (action: any) => {
    // هنا يتم تنفيذ الإجراءات التي يقترحها AI
    switch (action.type) {
      case 'file-edit':
        toast({
          title: "تعديل الملف",
          description: "تم اقتراح تعديلات على الملفات",
        });
        break;
      case 'server-command':
        toast({
          title: "أمر السيرفر",
          description: "تم اقتراح تنفيذ أوامر على السيرفر",
        });
        break;
      case 'erp-config':
        toast({
          title: "إعداد ERP",
          description: "تم اقتراح تكوينات لنظام ERP",
        });
        break;
    }
  };

  const handleFileSelect = (file: any) => {
    const message = `أريد فتح الملف: ${file.path}`;
    handleSendMessage(message, 'deepseek');
  };

  const handleCommandExecute = (command: string) => {
    const message = `نفذ الأمر التالي: ${command}`;
    handleSendMessage(message, 'deepseek');
  };

  const handleSaveSettings = async () => {
    localStorage.setItem('deepsec-pilot-settings', JSON.stringify(apiSettings));
    await initializeAIService(apiSettings);
    setShowSettings(false);
    
    toast({
      title: "تم الحفظ",
      description: "تم حفظ إعدادات API بنجاح",
    });
  };

  const isSettingsValid = () => {
    return apiSettings.deepseekApiKey || 
           (apiSettings.azureEndpoint && apiSettings.azureApiKey && apiSettings.azureDeploymentName);
  };

  return (
    <div className="h-screen flex flex-col bg-background" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <AppHeader
        connectionStatus={connectionStatus}
        onSettingsClick={() => setShowSettings(true)}
        onLanguageChange={setCurrentLanguage}
        currentLanguage={currentLanguage}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <ProjectSidebar
          onFileSelect={handleFileSelect}
          onCommandExecute={handleCommandExecute}
        />

        {/* Chat Interface */}
        <div className="flex-1 p-4">
          <ChatInterface
            onSendMessage={handleSendMessage}
            messages={messages}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              إعدادات التطبيق
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="api" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="api" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="server" className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                السيرفر
              </TabsTrigger>
              <TabsTrigger value="erp" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                ERP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="api" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline">DeepSeek</Badge>
                    إعدادات DeepSeek API
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="deepseek-key">مفتاح API</Label>
                    <Input
                      id="deepseek-key"
                      type="password"
                      placeholder="sk-..."
                      value={apiSettings.deepseekApiKey}
                      onChange={(e) => setApiSettings(prev => ({
                        ...prev,
                        deepseekApiKey: e.target.value
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline">Azure</Badge>
                    إعدادات Azure OpenAI
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="azure-endpoint">نقطة النهاية (Endpoint)</Label>
                    <Input
                      id="azure-endpoint"
                      placeholder="https://your-resource.openai.azure.com"
                      value={apiSettings.azureEndpoint}
                      onChange={(e) => setApiSettings(prev => ({
                        ...prev,
                        azureEndpoint: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="azure-key">مفتاح API</Label>
                    <Input
                      id="azure-key"
                      type="password"
                      value={apiSettings.azureApiKey}
                      onChange={(e) => setApiSettings(prev => ({
                        ...prev,
                        azureApiKey: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="azure-deployment">اسم النشر (Deployment Name)</Label>
                    <Input
                      id="azure-deployment"
                      placeholder="gpt-4"
                      value={apiSettings.azureDeploymentName}
                      onChange={(e) => setApiSettings(prev => ({
                        ...prev,
                        azureDeploymentName: e.target.value
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="server" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات السيرفر</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    إعدادات الاتصال بالسيرفر وتنفيذ الأوامر ستتم إضافتها هنا.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="erp" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات نظام ERP</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    إعدادات الاتصال بقاعدة بيانات ERP والوحدات ستتم إضافتها هنا.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={!isSettingsValid()}
              className="bg-gradient-primary hover:opacity-90"
            >
              حفظ الإعدادات
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;