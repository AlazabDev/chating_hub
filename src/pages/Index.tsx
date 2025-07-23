import React, { useState, useEffect } from 'react';
import { ChatInterface, ChatMessage } from '@/components/Chat/ChatInterface';
import EnhancedChatInterface from '@/components/AI/EnhancedChatInterface';
import RepositoryManager from '@/components/Repository/RepositoryManager';
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
import { ProductionConfig } from '@/components/Production/ProductionConfig';
import { ConnectivitySettings } from '@/components/Settings/ConnectivitySettings';
import { ThemeSettings } from '@/components/Settings/ThemeSettings';
import { LanguageSettings } from '@/components/Settings/LanguageSettings';
import { AISettings } from '@/components/Settings/AISettings';
import { Settings, Key, Server, Database, Rocket, GitBranch, Bot, Palette, Languages, Wifi } from 'lucide-react';

const Index = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'ar' | 'en'>('ar');
  const [aiService, setAiService] = useState<AIService | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'repositories'>('chat');
  const [connectionStatus, setConnectionStatus] = useState({
    deepseek: false,
    azureOpenAI: false,
    server: false
  });

  // إعدادات شاملة للتطبيق
  const [apiSettings, setApiSettings] = useState({
    deepseekApiKey: '',
    azureEndpoint: '',
    azureApiKey: '',
    azureDeploymentName: ''
  });

  const [connectivitySettings, setConnectivitySettings] = useState({
    gitHub: {
      token: '',
      username: '',
      autoSync: false
    },
    drive: {
      googleDrive: {
        clientId: '',
        clientSecret: '',
        enabled: false
      },
      oneDrive: {
        clientId: '',
        clientSecret: '',
        enabled: false
      }
    }
  });

  const [themeSettings, setThemeSettings] = useState({
    mode: 'dark' as 'light' | 'dark' | 'system',
    colorScheme: 'blue' as 'blue' | 'green' | 'purple' | 'orange' | 'pink',
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    borderRadius: 'medium' as 'none' | 'small' | 'medium' | 'large'
  });

  const [languageSettings, setLanguageSettings] = useState({
    language: 'ar' as 'ar' | 'en' | 'fr' | 'es',
    direction: 'rtl' as 'rtl' | 'ltr',
    dateFormat: 'dd/mm/yyyy' as 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd',
    timeFormat: '24h' as '12h' | '24h',
    autoDetect: false
  });

  const [aiExtendedSettings, setAIExtendedSettings] = useState({
    deepseekApiKey: '',
    azureEndpoint: '',
    azureApiKey: '',
    azureDeploymentName: '',
    defaultModel: 'deepseek' as 'deepseek' | 'azure-openai',
    temperature: 1,
    maxTokens: 2000,
    autoSave: true,
    enableStreaming: true,
    enableCodeExecution: false
  });

  const { toast } = useToast();

  useEffect(() => {
    // تحميل الإعدادات المحفوظة
    const savedSettings = localStorage.getItem('deepsec-pilot-settings');
    const savedConnectivity = localStorage.getItem('deepsec-pilot-connectivity');
    const savedTheme = localStorage.getItem('deepsec-pilot-theme');
    const savedLanguage = localStorage.getItem('deepsec-pilot-language');
    const savedAIExtended = localStorage.getItem('deepsec-pilot-ai-extended');

    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setApiSettings(settings);
      setAIExtendedSettings(prev => ({ ...prev, ...settings }));
      initializeAIService(settings);
    } else {
      setShowSettings(true);
    }

    if (savedConnectivity) {
      setConnectivitySettings(JSON.parse(savedConnectivity));
    }

    if (savedTheme) {
      const theme = JSON.parse(savedTheme);
      setThemeSettings(theme);
      // تطبيق الثيم المحفوظ
      document.documentElement.className = theme.mode;
    }

    if (savedLanguage) {
      const language = JSON.parse(savedLanguage);
      setLanguageSettings(language);
      // تطبيق اللغة المحفوظة
      document.documentElement.dir = language.direction;
      document.documentElement.lang = language.language;
      setCurrentLanguage(language.language);
    }

    if (savedAIExtended) {
      setAIExtendedSettings(JSON.parse(savedAIExtended));
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

  const handleSendMessage = async (content: string, model: 'deepseek' | 'azure-openai', context?: any) => {
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
      const response = await aiService.sendMessage(content, model, context);
      
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
    // حفظ جميع الإعدادات
    localStorage.setItem('deepsec-pilot-settings', JSON.stringify(apiSettings));
    localStorage.setItem('deepsec-pilot-connectivity', JSON.stringify(connectivitySettings));
    localStorage.setItem('deepsec-pilot-theme', JSON.stringify(themeSettings));
    localStorage.setItem('deepsec-pilot-language', JSON.stringify(languageSettings));
    localStorage.setItem('deepsec-pilot-ai-extended', JSON.stringify(aiExtendedSettings));
    
    await initializeAIService(apiSettings);
    setShowSettings(false);
    
    toast({
      title: "تم الحفظ",
      description: "تم حفظ جميع الإعدادات بنجاح",
    });
  };

  const isSettingsValid = () => {
    return aiExtendedSettings.deepseekApiKey || 
           (aiExtendedSettings.azureEndpoint && aiExtendedSettings.azureApiKey && aiExtendedSettings.azureDeploymentName);
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-border bg-muted/30">
            <div className="flex">
              <Button
                variant={activeTab === 'chat' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('chat')}
                className="rounded-none border-r"
              >
                <Bot className="w-4 h-4 ml-2" />
                مساعد الذكاء الاصطناعي
              </Button>
              <Button
                variant={activeTab === 'repositories' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('repositories')}
                className="rounded-none"
              >
                <GitBranch className="w-4 h-4 ml-2" />
                إدارة المستودعات
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' ? (
              <div className="h-full p-4">
                <EnhancedChatInterface
                  onSendMessage={handleSendMessage}
                  messages={messages}
                  isLoading={isLoading}
                />
              </div>
            ) : (
              <RepositoryManager />
            )}
          </div>
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

          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid w-full grid-cols-8 text-xs">
              <TabsTrigger value="ai" className="flex items-center gap-1">
                <Bot className="w-3 h-3" />
                ذكاء اصطناعي
              </TabsTrigger>
              <TabsTrigger value="connectivity" className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                الاتصال
              </TabsTrigger>
              <TabsTrigger value="theme" className="flex items-center gap-1">
                <Palette className="w-3 h-3" />
                الثيم
              </TabsTrigger>
              <TabsTrigger value="language" className="flex items-center gap-1">
                <Languages className="w-3 h-3" />
                اللغة
              </TabsTrigger>
              <TabsTrigger value="repositories" className="flex items-center gap-1">
                <GitBranch className="w-3 h-3" />
                المستودعات
              </TabsTrigger>
              <TabsTrigger value="server" className="flex items-center gap-1">
                <Server className="w-3 h-3" />
                السيرفر
              </TabsTrigger>
              <TabsTrigger value="erp" className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                ERP
              </TabsTrigger>
              <TabsTrigger value="production" className="flex items-center gap-1">
                <Rocket className="w-3 h-3" />
                الإنتاج
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-4">
              <AISettings
                aiSettings={aiExtendedSettings}
                onAISettingsChange={setAIExtendedSettings}
              />
            </TabsContent>

            <TabsContent value="connectivity" className="space-y-4">
              <ConnectivitySettings
                gitHubSettings={connectivitySettings.gitHub}
                onGitHubSettingsChange={(settings) => setConnectivitySettings(prev => ({
                  ...prev,
                  gitHub: settings
                }))}
                driveSettings={connectivitySettings.drive}
                onDriveSettingsChange={(settings) => setConnectivitySettings(prev => ({
                  ...prev,
                  drive: settings
                }))}
              />
            </TabsContent>

            <TabsContent value="theme" className="space-y-4">
              <ThemeSettings
                themeSettings={themeSettings}
                onThemeSettingsChange={setThemeSettings}
              />
            </TabsContent>

            <TabsContent value="language" className="space-y-4">
              <LanguageSettings
                languageSettings={languageSettings}
                onLanguageSettingsChange={setLanguageSettings}
              />
            </TabsContent>

            <TabsContent value="repositories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات المستودعات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="default-branch">الفرع الافتراضي</Label>
                    <Input
                      id="default-branch"
                      placeholder="main"
                      defaultValue="main"
                    />
                  </div>
                  <div>
                    <Label htmlFor="auto-sync">المزامنة التلقائية</Label>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="auto-sync" className="rounded" />
                      <Label htmlFor="auto-sync" className="text-sm">تمكين المزامنة التلقائية كل ساعة</Label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="workspace-path">مسار مساحة العمل</Label>
                    <Input
                      id="workspace-path"
                      placeholder="/opt/frappe-bench"
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
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="server-host">عنوان السيرفر</Label>
                    <Input
                      id="server-host"
                      placeholder="localhost"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ssh-user">مستخدم SSH</Label>
                      <Input
                        id="ssh-user"
                        placeholder="frappe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ssh-port">منفذ SSH</Label>
                      <Input
                        id="ssh-port"
                        placeholder="22"
                        type="number"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ssh-key">مفتاح SSH</Label>
                    <Textarea
                      id="ssh-key"
                      placeholder="-----BEGIN PRIVATE KEY-----"
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="erp" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات نظام ERP</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="erp-db-host">خادم قاعدة البيانات</Label>
                    <Input
                      id="erp-db-host"
                      placeholder="localhost"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="erp-db-user">اسم المستخدم</Label>
                      <Input
                        id="erp-db-user"
                        placeholder="erp_user"
                      />
                    </div>
                    <div>
                      <Label htmlFor="erp-db-pass">كلمة المرور</Label>
                      <Input
                        id="erp-db-pass"
                        type="password"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="production">
              <ProductionConfig />
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