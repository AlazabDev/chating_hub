
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
    <div className="h-full">
      <MainChatInterface
        messages={messages}
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        onClearConversation={onClearConversation}
        onNewConversation={onNewConversation}
      />
    </div>
  );
};

export default EnhancedAIPlatform;
