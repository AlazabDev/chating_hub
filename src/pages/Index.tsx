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
import { Settings, Key, Server, Database, Rocket, GitBranch, Bot, Palette, Languages, Wifi, HardDrive, Activity, BarChart3 } from 'lucide-react';
import BackupSettings from '@/components/Settings/BackupSettings';
import PerformanceMonitor from '@/components/Analytics/PerformanceMonitor';
import { useKeyboardShortcuts, createDefaultShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAutoSave } from '@/hooks/useAutoSave';
import ShortcutsHelper from '@/components/Layout/ShortcutsHelper';

const Index = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'ar' | 'en'>('ar');
  const [aiService, setAiService] = useState<AIService | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'repositories' | 'performance'>('chat');
  const [connectionStatus, setConnectionStatus] = useState({
    deepseek: false,
    azureOpenAI: false,
    server: false
  });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Auto-save settings
  useAutoSave({
    data: {
      api: apiSettings,
      connectivity: connectivitySettings,
      theme: themeSettings,
      language: languageSettings,
      aiExtended: aiExtendedSettings
    },
    onSave: async (data) => {
      localStorage.setItem('deepsec-pilot-settings', JSON.stringify(data.api));
      localStorage.setItem('deepsec-pilot-connectivity', JSON.stringify(data.connectivity));
      localStorage.setItem('deepsec-pilot-theme', JSON.stringify(data.theme));
      localStorage.setItem('deepsec-pilot-language', JSON.stringify(data.language));
      localStorage.setItem('deepsec-pilot-ai-extended', JSON.stringify(data.aiExtended));
    },
    delay: 3000,
    key: 'app-settings'
  });

  // Keyboard shortcuts
  const shortcuts = createDefaultShortcuts({
    openSearch: () => setShowSearch(true),
    openNotifications: () => setShowNotifications(true),
    openSettings: () => setShowSettings(true),
    toggleTheme: () => {
      const newTheme = themeSettings.mode === 'dark' ? 'light' : 'dark';
      setThemeSettings(prev => ({ ...prev, mode: newTheme }));
    },
    switchToChat: () => setActiveTab('chat'),
    switchToRepositories: () => setActiveTab('repositories'),
    switchToPerformance: () => setActiveTab('performance'),
    newConversation: () => {
      setMessages([]);
      toast({
        title: "محادثة جديدة",
        description: "تم بدء محادثة جديدة"
      });
    }
  });

  useKeyboardShortcuts({ 
    shortcuts: [
      ...shortcuts,
      {
        key: '?',
        action: () => setShowShortcuts(true),
        description: 'عرض اختصارات لوحة المفاتيح',
        category: 'general'
      }
    ]
  });

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
    <div className="h-screen flex flex-col bg-background relative overflow-hidden" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Header */}
      <AppHeader
        connectionStatus={connectionStatus}
        onSettingsClick={() => setShowSettings(true)}
        onLanguageChange={setCurrentLanguage}
        currentLanguage={currentLanguage}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar */}
        <div className="sidebar-enhanced">
          <ProjectSidebar
            onFileSelect={handleFileSelect}
            onCommandExecute={handleCommandExecute}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation - Enhanced */}
          <div className="glass-card border-b border-border/50 backdrop-blur-sm">
            <div className="flex relative">
              <Button
                variant={activeTab === 'chat' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('chat')}
                className={`tab-enhanced rounded-none border-r border-border/30 px-6 py-3 transition-all duration-300 ${
                  activeTab === 'chat' ? 'active bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-medium' : 'hover:bg-muted/30'
                }`}
              >
                <Bot className="w-4 h-4 ml-2" />
                <span className="font-medium">مساعد الذكاء الاصطناعي</span>
              </Button>
              <Button
                variant={activeTab === 'repositories' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('repositories')}
                className={`tab-enhanced rounded-none border-r border-border/30 px-6 py-3 transition-all duration-300 ${
                  activeTab === 'repositories' ? 'active bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-medium' : 'hover:bg-muted/30'
                }`}
              >
                <GitBranch className="w-4 h-4 ml-2" />
                <span className="font-medium">إدارة المستودعات</span>
              </Button>
              <Button
                variant={activeTab === 'performance' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('performance')}
                className={`tab-enhanced rounded-none px-6 py-3 transition-all duration-300 ${
                  activeTab === 'performance' ? 'active bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-medium' : 'hover:bg-muted/30'
                }`}
              >
                <Activity className="w-4 h-4 ml-2" />
                <span className="font-medium">مراقب الأداء</span>
              </Button>
            </div>
          </div>

          {/* Content - Enhanced */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'chat' ? (
              <div className="h-full p-6 animate-fade-in">
                <div className="h-full glass-card p-4 rounded-xl">
                  <EnhancedChatInterface
                    onSendMessage={handleSendMessage}
                    messages={messages}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            ) : activeTab === 'repositories' ? (
              <div className="h-full p-6 animate-fade-in">
                <div className="h-full glass-card rounded-xl overflow-hidden">
                  <RepositoryManager />
                </div>
              </div>
            ) : (
              <div className="h-full p-6 animate-fade-in">
                <div className="h-full glass-card rounded-xl overflow-hidden">
                  <PerformanceMonitor />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Dialog - Enhanced */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden glass-card animate-scale-in">
          {/* Header with gradient */}
          <DialogHeader className="pb-6 border-b border-border/30">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
                <Settings className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                إعدادات التطبيق
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] px-1">
            <Tabs defaultValue="ai" className="w-full">
              <TabsList className="grid w-full grid-cols-10 text-xs mb-6 glass-card p-1">
                <TabsTrigger value="ai" className="flex items-center gap-1 transition-all duration-200 hover-scale">
                  <Bot className="w-3 h-3" />
                  <span className="hidden md:inline">ذكاء اصطناعي</span>
                </TabsTrigger>
                <TabsTrigger value="connectivity" className="flex items-center gap-1 transition-all duration-200 hover-scale">
                  <Wifi className="w-3 h-3" />
                  <span className="hidden md:inline">الاتصال</span>
                </TabsTrigger>
                <TabsTrigger value="theme" className="flex items-center gap-1 transition-all duration-200 hover-scale">
                  <Palette className="w-3 h-3" />
                  <span className="hidden md:inline">الثيم</span>
                </TabsTrigger>
                <TabsTrigger value="language" className="flex items-center gap-1 transition-all duration-200 hover-scale">
                  <Languages className="w-3 h-3" />
                  <span className="hidden md:inline">اللغة</span>
                </TabsTrigger>
                <TabsTrigger value="repositories" className="flex items-center gap-1 transition-all duration-200 hover-scale">
                  <GitBranch className="w-3 h-3" />
                  <span className="hidden md:inline">المستودعات</span>
                </TabsTrigger>
                <TabsTrigger value="server" className="flex items-center gap-1 transition-all duration-200 hover-scale">
                  <Server className="w-3 h-3" />
                  <span className="hidden md:inline">السيرفر</span>
                </TabsTrigger>
                <TabsTrigger value="erp" className="flex items-center gap-1 transition-all duration-200 hover-scale">
                  <Database className="w-3 h-3" />
                  <span className="hidden md:inline">ERP</span>
                </TabsTrigger>
                <TabsTrigger value="production" className="flex items-center gap-1 transition-all duration-200 hover-scale">
                  <Rocket className="w-3 h-3" />
                  <span className="hidden md:inline">الإنتاج</span>
                </TabsTrigger>
                <TabsTrigger value="backup" className="flex items-center gap-1 transition-all duration-200 hover-scale">
                  <HardDrive className="w-3 h-3" />
                  <span className="hidden md:inline">النسخ الاحتياطي</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-1 transition-all duration-200 hover-scale">
                  <BarChart3 className="w-3 h-3" />
                  <span className="hidden md:inline">التحليلات</span>
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

            <TabsContent value="backup" className="space-y-4">
              <BackupSettings />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <PerformanceMonitor />
            </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/30">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
              className="btn-ghost-enhanced hover-scale"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={!isSettingsValid()}
              className="btn-primary-enhanced"
            >
              حفظ الإعدادات
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shortcuts Helper */}
      <ShortcutsHelper
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
};

export default Index;