import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Key, 
  Bot, 
  CreditCard, 
  Cloud, 
  Settings, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Activity,
  ExternalLink
} from 'lucide-react';

interface ApiKey {
  id: string;
  provider: string;
  key_name: string;
  encrypted_key: string;
  status: string;
  last_used: string | null;
  usage_count: number;
  created_at: string;
}

interface Integration {
  id: string;
  integration_type: string;
  provider: string;
  configuration: any;
  is_enabled: boolean;
  last_sync: string | null;
  created_at: string;
}

const IntegrationsManager: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKeys, setShowKeys] = useState<{[key: string]: boolean}>({});
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [newKey, setNewKey] = useState({
    provider: '',
    key_name: '',
    key_value: ''
  });
  const { toast } = useToast();

  const providers = [
    { id: 'openai', name: 'OpenAI', icon: Bot, type: 'ai_model', color: 'bg-green-500' },
    { id: 'anthropic', name: 'Anthropic (Claude)', icon: Bot, type: 'ai_model', color: 'bg-purple-500' },
    { id: 'deepseek', name: 'DeepSeek', icon: Bot, type: 'ai_model', color: 'bg-blue-500' },
    { id: 'stripe', name: 'Stripe', icon: CreditCard, type: 'payment', color: 'bg-indigo-500' },
    { id: 'google_drive', name: 'Google Drive', icon: Cloud, type: 'storage', color: 'bg-yellow-500' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [keysResponse, integrationsResponse] = await Promise.all([
        supabase.from('api_keys').select('*').order('created_at', { ascending: false }),
        supabase.from('integrations').select('*').order('created_at', { ascending: false })
      ]);

      if (keysResponse.error) throw keysResponse.error;
      if (integrationsResponse.error) throw integrationsResponse.error;

      setApiKeys(keysResponse.data || []);
      setIntegrations(integrationsResponse.data || []);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات التكاملات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addApiKey = async () => {
    if (!newKey.provider || !newKey.key_name || !newKey.key_value) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // تشفير المفتاح
      const { data: encryptedKey, error: encryptError } = await supabase
        .rpc('encrypt_api_key', { key_value: newKey.key_value });

      if (encryptError) throw encryptError;

      const { error } = await supabase
        .from('api_keys')
        .insert({
          provider: newKey.provider,
          key_name: newKey.key_name,
          encrypted_key: encryptedKey,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      // إنشاء أو تحديث التكامل
      await supabase
        .from('integrations')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          integration_type: providers.find(p => p.id === newKey.provider)?.type || 'other',
          provider: newKey.provider,
          configuration: { key_name: newKey.key_name },
          is_enabled: true
        }, { onConflict: 'user_id,integration_type,provider' });

      toast({
        title: "تم بنجاح",
        description: "تم إضافة مفتاح API بنجاح",
      });

      setNewKey({ provider: '', key_name: '', key_value: '' });
      setIsAddingKey(false);
      loadData();
    } catch (error: any) {
      console.error('خطأ في إضافة المفتاح:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة مفتاح API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حذف مفتاح API",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في حذف مفتاح API",
        variant: "destructive",
      });
    }
  };

  const toggleIntegration = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({ is_enabled: enabled })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم ${enabled ? 'تفعيل' : 'إلغاء'} التكامل`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث التكامل",
        variant: "destructive",
      });
    }
  };

  const testConnection = async (provider: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('test-api-connection', {
        body: { provider }
      });

      if (error) throw error;

      toast({
        title: data.success ? "نجح الاتصال" : "فشل الاتصال",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في الاختبار",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getProviderInfo = (providerId: string) => {
    return providers.find(p => p.id === providerId) || {
      id: providerId,
      name: providerId,
      icon: Settings,
      type: 'other',
      color: 'bg-gray-500'
    };
  };

  if (loading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">إدارة التكاملات والمفاتيح</h2>
          <p className="text-muted-foreground">قم بإدارة مفاتيح API والاتصالات الخارجية</p>
        </div>
        
        <Dialog open={isAddingKey} onOpenChange={setIsAddingKey}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة مفتاح جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة مفتاح API جديد</DialogTitle>
              <DialogDescription>
                أضف مفتاح API للتكامل مع خدمة خارجية
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="provider">المزود</Label>
                <select
                  id="provider"
                  value={newKey.provider}
                  onChange={(e) => setNewKey({...newKey, provider: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">اختر المزود</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="key_name">اسم المفتاح</Label>
                <Input
                  id="key_name"
                  value={newKey.key_name}
                  onChange={(e) => setNewKey({...newKey, key_name: e.target.value})}
                  placeholder="مثال: المفتاح الرئيسي"
                />
              </div>
              
              <div>
                <Label htmlFor="key_value">قيمة المفتاح</Label>
                <Input
                  id="key_value"
                  type="password"
                  value={newKey.key_value}
                  onChange={(e) => setNewKey({...newKey, key_value: e.target.value})}
                  placeholder="أدخل مفتاح API"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={addApiKey} disabled={loading} className="flex-1">
                  إضافة المفتاح
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingKey(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">المزودون</TabsTrigger>
          <TabsTrigger value="keys">مفاتيح API</TabsTrigger>
          <TabsTrigger value="usage">سجل الاستخدام</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => {
              const integration = integrations.find(i => i.provider === provider.id);
              const hasApiKey = apiKeys.some(k => k.provider === provider.id);
              const Icon = provider.icon;
              
              return (
                <Card key={provider.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${provider.color} text-white`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {provider.type === 'ai_model' && 'نموذج ذكاء اصطناعي'}
                            {provider.type === 'payment' && 'خدمة دفع'}
                            {provider.type === 'storage' && 'خدمة تخزين'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasApiKey ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">الحالة:</span>
                        <Badge variant={integration?.is_enabled ? "default" : "secondary"}>
                          {integration?.is_enabled ? 'مفعل' : 'غير مفعل'}
                        </Badge>
                      </div>
                      
                      {integration && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">تفعيل:</span>
                          <Switch
                            checked={integration.is_enabled}
                            onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                          />
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testConnection(provider.id)}
                          disabled={!hasApiKey}
                          className="flex-1"
                        >
                          اختبار الاتصال
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          {apiKeys.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد مفاتيح API</h3>
                <p className="text-muted-foreground mb-4">قم بإضافة مفتاح API للبدء في استخدام التكاملات</p>
                <Button onClick={() => setIsAddingKey(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة مفتاح جديد
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => {
                const provider = getProviderInfo(key.provider);
                const Icon = provider.icon;
                
                return (
                  <Card key={key.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${provider.color} text-white`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-medium">{key.key_name}</h4>
                            <p className="text-sm text-muted-foreground">{provider.name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                            {key.status === 'active' ? 'نشط' : 'غير نشط'}
                          </Badge>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowKeys({...showKeys, [key.id]: !showKeys[key.id]})}
                          >
                            {showKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteApiKey(key.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">آخر استخدام:</span>
                          <span>{key.last_used ? new Date(key.last_used).toLocaleDateString('ar') : 'لم يُستخدم بعد'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">عدد الاستخدامات:</span>
                          <span>{key.usage_count}</span>
                        </div>
                        
                        {showKeys[key.id] && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">المفتاح المشفر:</p>
                            <code className="text-xs break-all">{key.encrypted_key}</code>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                سجل الاستخدام
              </CardTitle>
              <CardDescription>
                تتبع استخدام مفاتيح API والتكاملات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                سيتم عرض سجل الاستخدام هنا قريباً
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationsManager;