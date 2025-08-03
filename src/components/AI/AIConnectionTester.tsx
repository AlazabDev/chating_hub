import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ModelStatus {
  model: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
}

export const AIConnectionTester = () => {
  const { toast } = useToast();
  const [models, setModels] = useState<ModelStatus[]>([
    { model: 'claude', status: 'idle' },
    { model: 'openai', status: 'idle' },
    { model: 'deepseek', status: 'idle' }
  ]);

  const testModel = async (modelName: string) => {
    setModels(prev => prev.map(m => 
      m.model === modelName 
        ? { ...m, status: 'testing', message: undefined }
        : m
    ));

    try {
      let response;
      
      if (modelName === 'claude') {
        response = await supabase.functions.invoke('claude-chat', {
          body: {
            message: 'مرحبا، هذا اختبار اتصال',
            conversationId: null,
            contextFiles: []
          }
        });
      } else {
        response = await supabase.functions.invoke('ai-chat', {
          body: {
            message: 'مرحبا، هذا اختبار اتصال',
            model: modelName,
            conversationId: null
          }
        });
      }

      if (response.error) {
        throw new Error(response.error.message || 'فشل في الاتصال');
      }

      setModels(prev => prev.map(m => 
        m.model === modelName 
          ? { ...m, status: 'success', message: 'تم الاتصال بنجاح' }
          : m
      ));

      toast({
        title: "نجح الاتصال",
        description: `تم الاتصال بنموذج ${modelName} بنجاح`,
      });

    } catch (error: any) {
      console.error(`خطأ في اختبار ${modelName}:`, error);
      
      setModels(prev => prev.map(m => 
        m.model === modelName 
          ? { 
              ...m, 
              status: 'error', 
              message: error.message || 'فشل في الاتصال'
            }
          : m
      ));

      toast({
        title: "فشل الاتصال",
        description: `فشل في الاتصال بنموذج ${modelName}: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const testAllModels = async () => {
    for (const model of models) {
      await testModel(model.model);
      // انتظار قصير بين الاختبارات
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getStatusIcon = (status: ModelStatus['status']) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: ModelStatus['status']) => {
    switch (status) {
      case 'testing':
        return <Badge variant="secondary">جاري الاختبار...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">متصل</Badge>;
      case 'error':
        return <Badge variant="destructive">غير متصل</Badge>;
      default:
        return <Badge variant="outline">لم يتم الاختبار</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          اختبار اتصال نماذج الذكاء الاصطناعي
          <Button onClick={testAllModels} variant="outline" size="sm">
            اختبار الكل
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {models.map((model) => (
            <div 
              key={model.model}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(model.status)}
                <div>
                  <h3 className="font-medium capitalize">
                    {model.model === 'claude' ? 'Claude (Anthropic)' : 
                     model.model === 'openai' ? 'OpenAI GPT' : 
                     'DeepSeek'}
                  </h3>
                  {model.message && (
                    <p className="text-sm text-muted-foreground">
                      {model.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(model.status)}
                <Button
                  onClick={() => testModel(model.model)}
                  disabled={model.status === 'testing'}
                  variant="outline"
                  size="sm"
                >
                  اختبار
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};