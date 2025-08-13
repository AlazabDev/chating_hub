
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, MessageSquare, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import MainChatInterface from '../Chat/MainChatInterface';

interface EnhancedAIPlatformProps {
  onSendMessage: (content: string, model: 'deepseek' | 'azure-openai' | 'claude') => Promise<void>;
  messages: any[];
  isLoading: boolean;
  modelStatus: {
    deepseek: boolean;
    azureOpenAI: boolean;
    claude: boolean;
  };
  onClearConversation: () => void;
  onNewConversation: () => void;
}

const EnhancedAIPlatform: React.FC<EnhancedAIPlatformProps> = ({
  onSendMessage,
  messages,
  isLoading,
  modelStatus,
  onClearConversation,
  onNewConversation
}) => {
  return (
    <div className="flex h-full gap-6">
      {/* Chat Interface - Main Area */}
      <div className="flex-1">
        <MainChatInterface
          messages={messages}
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          onClearConversation={onClearConversation}
          onNewConversation={onNewConversation}
        />
      </div>
      
      {/* Sidebar with Status and Stats */}
      <div className="w-80 space-y-4">
        <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="w-5 h-5" />
              حالة النماذج
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">DeepSeek</span>
                <Badge variant={modelStatus.deepseek ? "default" : "secondary"}>
                  {modelStatus.deepseek ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 mr-1" />
                  )}
                  {modelStatus.deepseek ? 'متصل' : 'غير متصل'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Azure OpenAI</span>
                <Badge variant={modelStatus.azureOpenAI ? "default" : "secondary"}>
                  {modelStatus.azureOpenAI ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 mr-1" />
                  )}
                  {modelStatus.azureOpenAI ? 'متصل' : 'غير متصل'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Claude</span>
                <Badge variant={modelStatus.claude ? "default" : "secondary"}>
                  {modelStatus.claude ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 mr-1" />
                  )}
                  {modelStatus.claude ? 'متصل' : 'غير متصل'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="w-5 h-5" />
              الإحصائيات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">المحادثات</span>
                <span className="font-medium">25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">الرسائل</span>
                <span className="font-medium">156</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5" />
              المستودعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">النشطة</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">الإجمالي</span>
                <span className="font-medium">12</span>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAIPlatform;
