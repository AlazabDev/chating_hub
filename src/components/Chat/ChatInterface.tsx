import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Code, 
  Server, 
  Terminal,
  FileCode,
  Settings,
  Brain
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'ai';
  model?: 'deepseek' | 'azure-openai';
  timestamp: Date;
  isCode?: boolean;
  action?: 'file-edit' | 'server-command' | 'erp-config';
}

interface ChatInterfaceProps {
  onSendMessage: (message: string, model: 'deepseek' | 'azure-openai') => Promise<void>;
  messages: ChatMessage[];
  isLoading: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onSendMessage, 
  messages, 
  isLoading 
}) => {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<'deepseek' | 'azure-openai'>('deepseek');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    try {
      await onSendMessage(message, selectedModel);
      setMessage('');
    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getActionIcon = (action?: string) => {
    switch (action) {
      case 'file-edit': return <FileCode className="w-4 h-4" />;
      case 'server-command': return <Terminal className="w-4 h-4" />;
      case 'erp-config': return <Settings className="w-4 h-4" />;
      default: return null;
    }
  };

  const getModelBadge = (model?: string) => {
    if (model === 'deepseek') {
      return <Badge variant="outline" className="text-primary">DeepSeek</Badge>;
    }
    if (model === 'azure-openai') {
      return <Badge variant="outline" className="text-accent">Azure OpenAI</Badge>;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-card rounded-lg border border-border shadow-card-custom">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6" />
          <div>
            <h2 className="text-xl font-bold">مساعد البرمجة الذكي</h2>
            <p className="text-sm opacity-80">DeepSeek & Azure OpenAI • إدارة أنظمة ERP</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">مرحباً بك في مساعد البرمجة الذكي</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                يمكنني مساعدتك في تطوير وإدارة أنظمة ERP، تعديل الملفات، وتنفيذ الأوامر البرمجية
              </p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className={`${
                    msg.type === 'ai' 
                      ? 'bg-gradient-primary text-primary-foreground' 
                      : 'bg-user-message text-foreground'
                  }`}>
                    {msg.type === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`space-y-2 ${msg.type === 'user' ? 'text-right' : ''}`}>
                  <Card className={`p-3 ${
                    msg.type === 'ai' 
                      ? 'bg-ai-message border-border' 
                      : 'bg-user-message border-primary'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {getModelBadge(msg.model)}
                      {msg.action && (
                        <Badge variant="secondary" className="text-xs">
                          {getActionIcon(msg.action)}
                          <span className="mr-1">
                            {msg.action === 'file-edit' && 'تعديل ملف'}
                            {msg.action === 'server-command' && 'أمر سيرفر'}
                            {msg.action === 'erp-config' && 'إعداد ERP'}
                          </span>
                        </Badge>
                      )}
                    </div>
                    
                    {msg.isCode ? (
                      <pre className="bg-code border border-code-border rounded p-3 text-sm overflow-x-auto">
                        <code>{msg.content}</code>
                      </pre>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    )}
                  </Card>
                  
                  <div className="text-xs text-muted-foreground">
                    {msg.timestamp.toLocaleTimeString('ar-EG')}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  <Bot className="w-4 h-4 animate-pulse" />
                </AvatarFallback>
              </Avatar>
              <Card className="p-3 bg-ai-message">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                  <span className="text-sm text-muted-foreground mr-2">جاري الكتابة...</span>
                </div>
              </Card>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2 mb-3">
          <Button
            variant={selectedModel === 'deepseek' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedModel('deepseek')}
            className="flex items-center gap-2"
          >
            <Brain className="w-4 h-4" />
            DeepSeek
          </Button>
          <Button
            variant={selectedModel === 'azure-openai' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedModel('azure-openai')}
            className="flex items-center gap-2"
          >
            <Server className="w-4 h-4" />
            Azure OpenAI
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder="اكتب رسالتك هنا... (يمكنك طلب تعديل ملفات، تنفيذ أوامر، أو إعداد ERP)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 bg-input border-border focus:ring-primary"
            dir="rtl"
          />
          <Button 
            onClick={handleSend} 
            disabled={!message.trim() || isLoading}
            className="bg-gradient-primary hover:opacity-90 shadow-ai"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};