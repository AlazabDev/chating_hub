import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface UseAIConversationProps {
  onConversationCreated?: (conversationId: string) => void;
}

export const useAIConversation = ({ onConversationCreated }: UseAIConversationProps = {}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      setLoading(true);
      
      const { data: messagesData, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages((messagesData || []) as Message[]);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('خطأ في تحميل المحادثة:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المحادثة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const sendMessage = useCallback(async (
    message: string,
    model: 'deepseek' | 'openai' = 'deepseek',
    repositoryContext?: {
      repositoryId?: string;
      currentFiles?: string[];
    }
  ) => {
    try {
      setLoading(true);

      // إضافة رسالة المستخدم فوراً
      const userMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: message,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);

      // استدعاء Edge Function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message,
          model,
          conversationId: currentConversationId,
          repositoryContext
        }
      });

      if (error) throw error;

      // إضافة رد الذكاء الاصطناعي
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: data.response,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev.slice(0, -1), userMessage, aiMessage]);

      // إذا كانت محادثة جديدة، حديث المعرف
      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId);
        onConversationCreated?.(data.conversationId);
      }

      return data.response;
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      
      // إزالة رسالة المستخدم في حالة الخطأ
      setMessages(prev => prev.slice(0, -1));
      
      toast({
        title: "خطأ",
        description: "فشل في إرسال الرسالة",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentConversationId, onConversationCreated, toast]);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  return {
    messages,
    loading,
    currentConversationId,
    sendMessage,
    loadConversation,
    startNewConversation,
    clearConversation
  };
};