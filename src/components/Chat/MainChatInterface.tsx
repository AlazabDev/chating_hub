import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  User, 
  Send, 
  MessageSquare, 
  Settings,
  Trash2,
  Copy,
  ChevronDown,
  Sparkles,
  Zap,
  Brain
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  model?: 'deepseek' | 'azure-openai' | 'claude';
}

interface MainChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, model: 'deepseek' | 'azure-openai' | 'claude') => Promise<void>;
  isLoading: boolean;
  onClearConversation: () => void;
  onNewConversation: () => void;
}

const MainChatInterface: React.FC<MainChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onClearConversation,
  onNewConversation
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<'deepseek' | 'azure-openai' | 'claude'>('deepseek');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // التمرير التلقائي إلى آخر رسالة
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!currentMessage.trim()) return;
    
    try {
      await onSendMessage(currentMessage, selectedModel);
      setCurrentMessage('');
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال الرسالة",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "تم النسخ",
      description: "تم نسخ الرسالة إلى الحافظة",
    });
  };

  const getModelIcon = (model: string) => {
    switch (model) {
      case 'deepseek':
        return <Brain className="w-3 h-3" />;
      case 'claude':
        return <Sparkles className="w-3 h-3" />;
      case 'azure-openai':
        return <Zap className="w-3 h-3" />;
      default:
        return <Bot className="w-3 h-3" />;
    }
  };

  const getModelName = (model: string) => {
    switch (model) {
      case 'deepseek':
        return 'DeepSeek';
      case 'claude':
        return 'Claude';
      case 'azure-openai':
        return 'Azure OpenAI';
      default:
        return model;
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="glass-card-strong p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <MessageSquare className="w-6 h-6 text-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-lg font-semibold">مساعد التطوير الذكي</h2>
              <p className="text-sm text-muted-foreground">
                {messages.length > 0 ? `${messages.length} رسالة` : 'ابدأ محادثة جديدة'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onNewConversation}
              className="hover-lift"
            >
              محادثة جديدة
            </Button>
            {messages.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClearConversation}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Model Selection */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">اختيار النموذج:</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedModel === 'deepseek' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedModel('deepseek')}
              className="hover-scale transition-all"
            >
              <Brain className="w-4 h-4 mr-2" />
              DeepSeek
              <Badge variant="secondary" className="mr-2">سريع</Badge>
            </Button>
            <Button
              variant={selectedModel === 'claude' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedModel('claude')}
              className="hover-scale transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Claude
              <Badge variant="secondary" className="mr-2">ذكي</Badge>
            </Button>
            <Button
              variant={selectedModel === 'azure-openai' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedModel('azure-openai')}
              className="hover-scale transition-all"
            >
              <Zap className="w-4 h-4 mr-2" />
              OpenAI
              <Badge variant="secondary" className="mr-2">متوازن</Badge>
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary-glow/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">مرحباً بك في مساعد التطوير</h3>
                <p className="text-muted-foreground max-w-md">
                  يمكنني مساعدتك في مهام التطوير المختلفة مثل كتابة الكود، إنشاء صفحات الهبوط، 
                  وحل المشاكل التقنية. ابدأ بكتابة سؤالك أو طلبك.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <Card className="p-4 hover-lift cursor-pointer" onClick={() => setCurrentMessage('أريد إنشاء صفحة هبوط حديثة')}>
                  <h4 className="font-medium mb-1">إنشاء صفحة هبوط</h4>
                  <p className="text-sm text-muted-foreground">تصميم صفحة هبوط حديثة وجذابة</p>
                </Card>
                <Card className="p-4 hover-lift cursor-pointer" onClick={() => setCurrentMessage('ساعدني في تصحيح خطأ في الكود')}>
                  <h4 className="font-medium mb-1">تصحيح الأخطاء</h4>
                  <p className="text-sm text-muted-foreground">مساعدة في حل مشاكل الكود</p>
                </Card>
                <Card className="p-4 hover-lift cursor-pointer" onClick={() => setCurrentMessage('أريد إنشاء مكون React جديد')}>
                  <h4 className="font-medium mb-1">مكونات React</h4>
                  <p className="text-sm text-muted-foreground">إنشاء مكونات React قابلة للإعادة الاستخدام</p>
                </Card>
                <Card className="p-4 hover-lift cursor-pointer" onClick={() => setCurrentMessage('كيف يمكنني تحسين أداء التطبيق؟')}>
                  <h4 className="font-medium mb-1">تحسين الأداء</h4>
                  <p className="text-sm text-muted-foreground">نصائح لتحسين أداء التطبيق</p>
                </Card>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex gap-4 animate-fade-in ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center flex-shrink-0 shadow-ai">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] group ${
                    message.role === 'user' ? 'ml-auto' : ''
                  }`}>
                    <div className={`rounded-2xl p-4 shadow-card ${
                      message.role === 'user' 
                        ? 'message-bubble-user bg-primary text-primary-foreground' 
                        : 'message-bubble-ai bg-card border'
                    }`}>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-current/10">
                        <div className="flex items-center gap-2">
                          <span className="text-xs opacity-70">
                            {formatMessageTime(message.created_at)}
                          </span>
                          {message.model && (
                            <Badge variant="outline" className="text-xs">
                              {getModelIcon(message.model)}
                              <span className="mr-1">{getModelName(message.model)}</span>
                            </Badge>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessage(message.content)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center flex-shrink-0 shadow-card">
                      <User className="w-5 h-5 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 animate-fade-in">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center flex-shrink-0 shadow-ai animate-pulse">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="bg-card border rounded-2xl p-4 shadow-card">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {getModelName(selectedModel)} يكتب الآن...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="glass-card-strong p-4 border-t">
        <div className="flex gap-3">
          <div className="flex-1">
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك هنا... (اضغط Enter للإرسال، Shift+Enter لسطر جديد)"
              className="resize-none focus:ring-2 focus:ring-primary transition-all"
              rows={3}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>النموذج المحدد: {getModelName(selectedModel)}</span>
              <span>{currentMessage.length} حرف</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSend}
              disabled={isLoading || !currentMessage.trim()}
              className="btn-primary-enhanced h-12 w-12 p-0"
              size="sm"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainChatInterface;