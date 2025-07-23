export interface AIResponse {
  content: string;
  model: 'deepseek' | 'azure-openai';
  action?: {
    type: 'file-edit' | 'server-command' | 'erp-config';
    details: any;
  };
}

export interface AIServiceConfig {
  deepseekApiKey?: string;
  azureOpenAIConfig?: {
    endpoint: string;
    apiKey: string;
    deploymentName: string;
  };
}

export class AIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  async sendMessage(
    message: string, 
    model: 'deepseek' | 'azure-openai',
    context?: {
      currentFiles?: string[];
      systemStatus?: any;
      erpConfig?: any;
    }
  ): Promise<AIResponse> {
    try {
      if (model === 'deepseek') {
        return await this.sendToDeepSeek(message, context);
      } else {
        return await this.sendToAzureOpenAI(message, context);
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('فشل في الاتصال بخدمة الذكاء الاصطناعي');
    }
  }

  private async sendToDeepSeek(message: string, context?: any): Promise<AIResponse> {
    if (!this.config.deepseekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const systemPrompt = this.buildSystemPrompt(context);
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'لم أتمكن من الحصول على رد';

    return {
      content,
      model: 'deepseek',
      action: this.extractActionFromResponse(content)
    };
  }

  private async sendToAzureOpenAI(message: string, context?: any): Promise<AIResponse> {
    if (!this.config.azureOpenAIConfig) {
      throw new Error('Azure OpenAI not configured');
    }

    const { endpoint, apiKey, deploymentName } = this.config.azureOpenAIConfig;
    const systemPrompt = this.buildSystemPrompt(context);

    const response = await fetch(
      `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          stream: false
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Azure OpenAI API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'لم أتمكن من الحصول على رد';

    return {
      content,
      model: 'azure-openai',
      action: this.extractActionFromResponse(content)
    };
  }

  private buildSystemPrompt(context?: any): string {
    return `أنت مساعد برمجة ذكي متخصص في تطوير وإدارة أنظمة ERP. يمكنك:

1. تحليل وتعديل الملفات البرمجية
2. تنفيذ أوامر السيرفر بأمان
3. إعداد وتكوين أنظمة ERP
4. كتابة وتحسين الكود
5. إدارة قواعد البيانات
6. مراقبة أداء النظام

المبادئ الأساسية:
- الأمان أولاً: لا تنفذ أي أوامر قد تضر بالنظام
- الوضوح: اشرح كل خطوة قبل تنفيذها
- التوثيق: وثق جميع التغييرات
- الكفاءة: اقترح الحلول الأمثل

إذا طُلب منك تنفيذ إجراء معين، ضع في الاعتبار:
- نوع الملف أو النظام المطلوب
- التأثير المحتمل للتغيير
- الاحتياطات اللازمة
- البدائل الآمنة

${context ? `
السياق الحالي:
- الملفات المفتوحة: ${context.currentFiles?.join(', ') || 'لا توجد'}
- حالة النظام: ${context.systemStatus ? JSON.stringify(context.systemStatus, null, 2) : 'غير متوفرة'}
- إعدادات ERP: ${context.erpConfig ? JSON.stringify(context.erpConfig, null, 2) : 'غير متوفرة'}
` : ''}

أجب باللغة العربية مع إمكانية استخدام المصطلحات التقنية الإنجليزية عند الضرورة.`;
  }

  private extractActionFromResponse(content: string): AIResponse['action'] {
    // تحليل الرد لاستخراج الإجراءات المطلوبة
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const codeBlocks = Array.from(content.matchAll(codeBlockRegex));

    if (content.includes('تعديل الملف') || content.includes('edit file')) {
      return {
        type: 'file-edit',
        details: {
          files: codeBlocks.map(block => ({
            language: block[1] || 'text',
            content: block[2]
          }))
        }
      };
    }

    if (content.includes('تنفيذ الأمر') || content.includes('execute command')) {
      const commandRegex = /`([^`]+)`/g;
      const commands = Array.from(content.matchAll(commandRegex));
      return {
        type: 'server-command',
        details: {
          commands: commands.map(cmd => cmd[1])
        }
      };
    }

    if (content.includes('إعداد ERP') || content.includes('ERP config')) {
      return {
        type: 'erp-config',
        details: {
          modules: codeBlocks,
          configurations: []
        }
      };
    }

    return undefined;
  }

  async testConnection(model: 'deepseek' | 'azure-openai'): Promise<boolean> {
    try {
      const response = await this.sendMessage('مرحبا', model);
      return response.content.length > 0;
    } catch (error) {
      console.error(`Connection test failed for ${model}:`, error);
      return false;
    }
  }

  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}