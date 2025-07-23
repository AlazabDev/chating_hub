import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  User, 
  Send, 
  Code, 
  Terminal, 
  Database,
  GitBranch,
  Settings,
  Sparkles,
  MessageSquare,
  Cpu,
  Brain,
  Zap
} from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'ai';
  model?: 'deepseek' | 'azure-openai';
  timestamp: Date;
  isCode?: boolean;
  action?: string;
  repository_context?: string;
  code_suggestions?: CodeSuggestion[];
}

interface CodeSuggestion {
  file_path: string;
  line_number: number;
  suggestion: string;
  type: 'fix' | 'optimization' | 'feature';
}

interface EnhancedChatInterfaceProps {
  onSendMessage: (content: string, model: 'deepseek' | 'azure-openai', context?: any) => Promise<void>;
  messages: ChatMessage[];
  isLoading: boolean;
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  onSendMessage,
  messages,
  isLoading
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<'deepseek' | 'azure-openai'>('deepseek');
  const [contextMode, setContextMode] = useState<'simple' | 'repository' | 'advanced'>('simple');
  const [selectedRepository, setSelectedRepository] = useState<string>('');
  const [repositories, setRepositories] = useState<any[]>([]);
  const [activeContext, setActiveContext] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // نماذج الرسائل السريعة
  const quickPrompts = [
    {
      category: 'تطوير',
      prompts: [
        'قم بتحليل هذا الكود وتحسينه',
        'أنشئ API endpoint جديد',
        'اكتب اختبارات للمكون الحالي',
        'راجع الأمان في هذا الكود'
      ]
    },
    {
      category: 'Frappe',
      prompts: [
        'إنشاء DocType جديد',
        'كتابة Custom Script',
        'تصميم Report مخصص',
        'إعداد Workflow'
      ]
    },
    {
      category: 'قاعدة البيانات',
      prompts: [
        'تحسين استعلام SQL',
        'إنشاء migration جديد',
        'تحليل أداء الجداول',
        'إعداد فهارس'
      ]
    }
  ];

  useEffect(() => {
    loadRepositories();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadRepositories = async () => {
    try {
      const { data, error } = await supabase
        .from('repositories')
        .select('id, name, frappe_type')
        .eq('status', 'active');

      if (error) throw error;
      setRepositories(data || []);
    } catch (error) {
      console.error('Error loading repositories:', error);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSend = async () => {
    if (!currentMessage.trim()) return;

    try {
      // إعداد السياق حسب النمط المحدد
      let context = activeContext;
      
      if (contextMode === 'repository' && selectedRepository) {
        const repo = repositories.find(r => r.id === selectedRepository);
        context = {
          repository: repo,
          current_files: [], // سيتم تحديثه لاحقاً
          project_structure: {} // سيتم تحديثه لاحقاً
        };
      } else if (contextMode === 'advanced') {
        context = {
          system_status: await getSystemStatus(),
          active_repositories: repositories,
          recent_operations: await getRecentOperations()
        };
      }

      await onSendMessage(currentMessage, selectedModel, context);
      setCurrentMessage('');
    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  };

  const getSystemStatus = async () => {
    // محاكاة جلب حالة النظام
    return {
      cpu_usage: Math.floor(Math.random() * 100),
      memory_usage: Math.floor(Math.random() * 100),
      active_services: ['nginx', 'mysql', 'redis', 'frappe'],
      uptime: '7 days, 12 hours'
    };
  };

  const getRecentOperations = async () => {
    try {
      const { data, error } = await supabase
        .from('repository_operations')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(5);

      return data || [];
    } catch (error) {
      return [];
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setCurrentMessage(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getModelIcon = (model: string) => {
    switch (model) {
      case 'deepseek': return <Brain className="w-4 h-4" />;
      case 'azure-openai': return <Cpu className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  const getActionIcon = (action?: string) => {
    switch (action) {
      case 'file-edit': return <Code className="w-4 h-4" />;
      case 'server-command': return <Terminal className="w-4 h-4" />;
      case 'erp-config': return <Database className="w-4 h-4" />;
      case 'git-operation': return <GitBranch className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">مساعد التطوير الذكي</h2>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={(value: any) => setSelectedModel(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deepseek">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    DeepSeek
                  </div>
                </SelectItem>
                <SelectItem value="azure-openai">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    Azure OpenAI
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Context Mode */}
        <div className="mt-3">
          <Tabs value={contextMode} onValueChange={(value: any) => setContextMode(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="simple">بسيط</TabsTrigger>
              <TabsTrigger value="repository">مستودع محدد</TabsTrigger>
              <TabsTrigger value="advanced">متقدم</TabsTrigger>
            </TabsList>
            
            <TabsContent value="repository" className="mt-2">
              <Select value={selectedRepository} onValueChange={setSelectedRepository}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مستودع" />
                </SelectTrigger>
                <SelectContent>
                  {repositories.map((repo) => (
                    <SelectItem key={repo.id} value={repo.id}>
                      {repo.name} ({repo.frappe_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="p-3 border-b border-border bg-muted/30">
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {quickPrompts.map((category, categoryIndex) => (
              <div key={categoryIndex} className="flex-shrink-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">{category.category}</p>
                <div className="flex gap-1">
                  {category.prompts.slice(0, 2).map((prompt, promptIndex) => (
                    <Button
                      key={promptIndex}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickPrompt(prompt)}
                      className="text-xs whitespace-nowrap"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'ai' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : ''}`}>
                <div className={`p-3 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-user-message text-foreground' 
                    : 'bg-ai-message text-foreground'
                }`}>
                  {message.isCode ? (
                    <pre className="bg-code p-2 rounded text-sm overflow-x-auto">
                      <code>{message.content}</code>
                    </pre>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                  
                  {message.code_suggestions && (
                    <div className="mt-3 space-y-2">
                      {message.code_suggestions.map((suggestion, index) => (
                        <div key={index} className="p-2 bg-code rounded text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <Code className="w-3 h-3" />
                            <span className="font-medium">{suggestion.file_path}:{suggestion.line_number}</span>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.type}
                            </Badge>
                          </div>
                          <p>{suggestion.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{message.timestamp.toLocaleTimeString('ar-SA')}</span>
                  {message.model && (
                    <div className="flex items-center gap-1">
                      {getModelIcon(message.model)}
                      <span>{message.model}</span>
                    </div>
                  )}
                  {message.action && getActionIcon(message.action)}
                </div>
              </div>

              {message.type === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center order-1">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-ai-message p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">يكتب...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex gap-2">
          <Textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اكتب رسالتك هنا... (Enter للإرسال، Shift+Enter لسطر جديد)"
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !currentMessage.trim()}
            className="self-end bg-gradient-primary hover:opacity-90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {selectedRepository && (
          <div className="mt-2 text-xs text-muted-foreground">
            السياق: {repositories.find(r => r.id === selectedRepository)?.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedChatInterface;