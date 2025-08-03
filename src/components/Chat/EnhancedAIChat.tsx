import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, User, Send, MessageSquare, Settings, Zap } from 'lucide-react';
import { useAIConversation } from '@/hooks/useAIConversation';
import { useToast } from '@/hooks/use-toast';

interface EnhancedAIChatProps {
  onConversationCreated?: (conversationId: string) => void;
}

const EnhancedAIChat: React.FC<EnhancedAIChatProps> = ({ onConversationCreated }) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<'deepseek' | 'azure-openai'>('deepseek');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const {
    messages,
    loading,
    currentConversationId,
    sendMessage,
    startNewConversation,
    clearConversation
  } = useAIConversation({ onConversationCreated });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || loading) return;

    const messageToSend = currentMessage;
    setCurrentMessage('');

    try {
      await sendMessage(messageToSend, selectedModel);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال الرسالة",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getModelIcon = (model: string) => {
    return model === 'deepseek' ? <Zap className="w-3 h-3" /> : <Bot className="w-3 h-3" />;
  };

  const getModelName = (model: string) => {
    return model === 'deepseek' ? 'DeepSeek' : 'Azure OpenAI';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            محادثة ذكية متقدمة
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={(value: any) => setSelectedModel(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deepseek">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    DeepSeek
                  </div>
                </SelectItem>
                <SelectItem value="azure-openai">
                  <div className="flex items-center gap-2">
                    <Bot className="w-3 h-3" />
                    Azure OpenAI
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={startNewConversation}
            >
              محادثة جديدة
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
                <p>مرحباً! أنا مساعدك الذكي للبرمجة وإدارة المشاريع.</p>
                <p className="text-sm mt-2">يمكنك اختيار النموذج والبدء في المحادثة</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                
                <div className={`max-w-[70%] p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {new Date(message.created_at).toLocaleTimeString('ar-SA')}
                    </span>
                    {message.role === 'assistant' && (
                      <Badge variant="outline" className="text-xs">
                        {getModelIcon(selectedModel)}
                        {getModelName(selectedModel)}
                      </Badge>
                    )}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm">{getModelName(selectedModel)} يكتب...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك هنا... (اضغط Enter للإرسال)"
              className="flex-1 min-h-[44px] max-h-32"
              disabled={loading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !currentMessage.trim()}
              className="px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedAIChat;