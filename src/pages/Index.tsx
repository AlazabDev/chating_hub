
import React from 'react';
import { useAIConversation } from '@/hooks/useAIConversation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, User, MessageSquare, Database, Send, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const Index = () => {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<'deepseek' | 'azure-openai'>('deepseek');
  
  const { messages, loading, sendMessage, startNewConversation } = useAIConversation();

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      await sendMessage(message, selectedModel);
      setMessage('');
      toast.success('تم إرسال الرسالة بنجاح');
    } catch (error) {
      toast.error('فشل في إرسال الرسالة');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">مساعد الذكاء الاصطناعي</h1>
          <p className="text-muted-foreground">منصة بسيطة وعملية للتفاعل مع الذكاء الاصطناعي</p>
        </div>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">المحادثة</TabsTrigger>
            <TabsTrigger value="repositories">المستودعات</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  المحادثة
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={selectedModel === 'deepseek' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedModel('deepseek')}
                  >
                    DeepSeek
                  </Button>
                  <Button
                    variant={selectedModel === 'azure-openai' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedModel('azure-openai')}
                  >
                    Azure OpenAI
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startNewConversation}
                  >
                    محادثة جديدة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full border rounded-lg p-4 mb-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                        <div className={`max-w-[70%] p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString('ar-SA')}
                          </p>
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-secondary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {loading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>يكتب...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                <div className="flex gap-2">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="اكتب رسالتك هنا..."
                    className="flex-1"
                    rows={3}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={loading || !message.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="repositories" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  المستودعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* نموذج للمستودعات */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">مستودع نموذجي</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="secondary">نشط</Badge>
                        <p className="text-sm text-muted-foreground">مستودع للاختبار</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            تحديث
                          </Button>
                          <Button size="sm" variant="outline">
                            نشر
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
