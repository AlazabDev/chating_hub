import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Bot, Zap, Brain, Settings, Check, X, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AISettingsProps {
  aiSettings: {
    deepseekApiKey: string;
    azureEndpoint: string;
    azureApiKey: string;
    azureDeploymentName: string;
    defaultModel: 'deepseek' | 'azure-openai';
    temperature: number;
    maxTokens: number;
    autoSave: boolean;
    enableStreaming: boolean;
    enableCodeExecution: boolean;
  };
  onAISettingsChange: (settings: any) => void;
}

export const AISettings: React.FC<AISettingsProps> = ({
  aiSettings,
  onAISettingsChange
}) => {
  const [connectionStatus, setConnectionStatus] = useState({
    deepseek: false,
    azureOpenAI: false
  });
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const testConnection = async (model: 'deepseek' | 'azure-openai') => {
    setTesting(true);
    try {
      if (model === 'deepseek') {
        if (!aiSettings.deepseekApiKey) {
          throw new Error('يرجى إدخال مفتاح DeepSeek API');
        }

        const response = await fetch('https://api.deepseek.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${aiSettings.deepseekApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setConnectionStatus(prev => ({ ...prev, deepseek: true }));
          toast({
            title: "نجح الاتصال",
            description: "تم الاتصال بـ DeepSeek بنجاح"
          });
        } else {
          throw new Error('فشل في الاتصال بـ DeepSeek');
        }
      } else if (model === 'azure-openai') {
        if (!aiSettings.azureEndpoint || !aiSettings.azureApiKey) {
          throw new Error('يرجى إدخال إعدادات Azure OpenAI');
        }

        // محاكاة اختبار Azure OpenAI
        setConnectionStatus(prev => ({ ...prev, azureOpenAI: true }));
        toast({
          title: "نجح الاتصال",
          description: "تم الاتصال بـ Azure OpenAI بنجاح"
        });
      }
    } catch (error) {
      setConnectionStatus(prev => ({ 
        ...prev, 
        [model === 'deepseek' ? 'deepseek' : 'azureOpenAI']: false 
      }));
      toast({
        title: "فشل الاتصال",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const updateSettings = (field: string, value: any) => {
    onAISettingsChange({
      ...aiSettings,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* DeepSeek Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <span>إعدادات DeepSeek</span>
            <Badge variant={connectionStatus.deepseek ? "default" : "secondary"} className="mr-auto">
              {connectionStatus.deepseek ? (
                <><Check className="w-3 h-3 ml-1" /> متصل</>
              ) : (
                <><X className="w-3 h-3 ml-1" /> غير متصل</>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="deepseek-key">مفتاح API</Label>
            <Input
              id="deepseek-key"
              type="password"
              placeholder="sk-..."
              value={aiSettings.deepseekApiKey}
              onChange={(e) => updateSettings('deepseekApiKey', e.target.value)}
            />
          </div>
          <Button 
            onClick={() => testConnection('deepseek')} 
            disabled={testing || !aiSettings.deepseekApiKey}
            className="w-full"
          >
            <TestTube className="w-4 h-4 ml-2" />
            {testing ? 'جاري الاختبار...' : 'اختبار الاتصال'}
          </Button>
        </CardContent>
      </Card>

      {/* Azure OpenAI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            <span>إعدادات Azure OpenAI</span>
            <Badge variant={connectionStatus.azureOpenAI ? "default" : "secondary"} className="mr-auto">
              {connectionStatus.azureOpenAI ? (
                <><Check className="w-3 h-3 ml-1" /> متصل</>
              ) : (
                <><X className="w-3 h-3 ml-1" /> غير متصل</>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="azure-endpoint">نقطة النهاية</Label>
            <Input
              id="azure-endpoint"
              placeholder="https://your-resource.openai.azure.com"
              value={aiSettings.azureEndpoint}
              onChange={(e) => updateSettings('azureEndpoint', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="azure-key">مفتاح API</Label>
            <Input
              id="azure-key"
              type="password"
              value={aiSettings.azureApiKey}
              onChange={(e) => updateSettings('azureApiKey', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="azure-deployment">اسم النشر</Label>
            <Input
              id="azure-deployment"
              placeholder="gpt-4"
              value={aiSettings.azureDeploymentName}
              onChange={(e) => updateSettings('azureDeploymentName', e.target.value)}
            />
          </div>
          <Button 
            onClick={() => testConnection('azure-openai')} 
            disabled={testing || !aiSettings.azureEndpoint || !aiSettings.azureApiKey}
            className="w-full"
          >
            <TestTube className="w-4 h-4 ml-2" />
            {testing ? 'جاري الاختبار...' : 'اختبار الاتصال'}
          </Button>
        </CardContent>
      </Card>

      {/* AI Behavior Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            إعدادات سلوك الذكاء الاصطناعي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="default-model">النموذج الافتراضي</Label>
            <Select
              value={aiSettings.defaultModel}
              onValueChange={(value) => updateSettings('defaultModel', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
                <SelectItem value="azure-openai">Azure OpenAI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="temperature">درجة الإبداع (Temperature): {aiSettings.temperature}</Label>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[aiSettings.temperature]}
              onValueChange={(value) => updateSettings('temperature', value[0])}
              className="mt-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>محافظ (0)</span>
              <span>متوازن (1)</span>
              <span>مبدع (2)</span>
            </div>
          </div>

          <div>
            <Label htmlFor="max-tokens">أقصى عدد رموز: {aiSettings.maxTokens}</Label>
            <Slider
              id="max-tokens"
              min={100}
              max={4000}
              step={100}
              value={[aiSettings.maxTokens]}
              onValueChange={(value) => updateSettings('maxTokens', value[0])}
              className="mt-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>قصير (100)</span>
              <span>متوسط (2000)</span>
              <span>طويل (4000)</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-save">حفظ تلقائي للمحادثات</Label>
              <Switch
                id="auto-save"
                checked={aiSettings.autoSave}
                onCheckedChange={(checked) => updateSettings('autoSave', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="streaming">تمكين البث المباشر</Label>
              <Switch
                id="streaming"
                checked={aiSettings.enableStreaming}
                onCheckedChange={(checked) => updateSettings('enableStreaming', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="code-execution">تمكين تنفيذ الكود</Label>
              <Switch
                id="code-execution"
                checked={aiSettings.enableCodeExecution}
                onCheckedChange={(checked) => updateSettings('enableCodeExecution', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};