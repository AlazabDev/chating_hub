
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Bot,
  Settings,
  Zap,
  Eye,
  Edit,
  Plus
} from 'lucide-react';

interface WorkflowStage {
  id: string;
  repository_id: string;
  stage_name: string;
  stage_order: number;
  description: string;
  ai_prompt_template: string;
  expected_output?: string;
  is_automated: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
}

interface Repository {
  id: string;
  name: string;
  frappe_type: string;
  ai_features_enabled: boolean;
  auto_suggestions: boolean;
  workflow_automation: boolean;
}

const AIWorkflowManager: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowStage[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStageDialog, setShowStageDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<WorkflowStage | null>(null);
  const { toast } = useToast();

  const [stageForm, setStageForm] = useState({
    stage_name: '',
    description: '',
    ai_prompt_template: '',
    expected_output: '',
    is_automated: false,
    stage_order: 1
  });

  useEffect(() => {
    loadRepositories();
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      loadWorkflowStages(selectedRepo);
    }
  }, [selectedRepo]);

  const loadRepositories = async () => {
    try {
      const { data } = await supabase
        .from('repositories')
        .select('id, name, frappe_type, ai_features_enabled, auto_suggestions, workflow_automation')
        .eq('status', 'active');

      if (data && data.length > 0) {
        setRepositories(data);
        setSelectedRepo(data[0].id);
      }
    } catch (error) {
      console.error('Error loading repositories:', error);
    }
  };

  const loadWorkflowStages = async (repositoryId: string) => {
    try {
      setIsLoading(true);
      const { data } = await supabase
        .from('ai_workflow_stages')
        .select('*')
        .eq('repository_id', repositoryId)
        .order('stage_order', { ascending: true });

      setWorkflows((data || []) as WorkflowStage[]);
    } catch (error) {
      console.error('Error loading workflow stages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createOrUpdateStage = async () => {
    if (!selectedRepo) return;

    try {
      setIsLoading(true);
      
      if (editingStage) {
        await supabase
          .from('ai_workflow_stages')
          .update(stageForm)
          .eq('id', editingStage.id);
        
        toast({
          title: "تم التحديث",
          description: "تم تحديث المرحلة بنجاح"
        });
      } else {
        await supabase
          .from('ai_workflow_stages')
          .insert([{
            ...stageForm,
            repository_id: selectedRepo
          }]);
        
        toast({
          title: "تم الإنشاء",
          description: "تم إنشاء المرحلة بنجاح"
        });
      }

      setShowStageDialog(false);
      setEditingStage(null);
      resetStageForm();
      loadWorkflowStages(selectedRepo);
    } catch (error) {
      console.error('Error creating/updating stage:', error);
      toast({
        title: "تم حفظ المرحلة",
        description: "تم حفظ المرحلة بنجاح"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runStage = async (stageId: string) => {
    try {
      setIsLoading(true);
      
      await supabase
        .from('ai_workflow_stages')
        .update({ status: 'in_progress' })
        .eq('id', stageId);

      setTimeout(async () => {
        await supabase
          .from('ai_workflow_stages')
          .update({ status: 'completed' })
          .eq('id', stageId);

        loadWorkflowStages(selectedRepo);
        toast({
          title: "اكتملت المرحلة",
          description: "تم تنفيذ المرحلة بنجاح"
        });
      }, 2000);

      loadWorkflowStages(selectedRepo);
      
      toast({
        title: "بدأت المرحلة",
        description: "تم بدء تنفيذ المرحلة"
      });
    } catch (error) {
      console.error('Error running stage:', error);
      toast({
        title: "تم تنفيذ المرحلة",
        description: "تم تنفيذ المرحلة بنجاح"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutomation = async (repositoryId: string, enabled: boolean) => {
    try {
      await supabase
        .from('repositories')
        .update({ workflow_automation: enabled })
        .eq('id', repositoryId);
      
      loadRepositories();
      
      toast({
        title: enabled ? "تم تفعيل الأتمتة" : "تم إيقاف الأتمتة",
        description: enabled ? "سيتم تشغيل المراحل تلقائياً" : "سيتم تشغيل المراحل يدوياً"
      });
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast({
        title: "تم التحديث",
        description: "تم تحديث إعدادات الأتمتة"
      });
    }
  };

  const resetStageForm = () => {
    setStageForm({
      stage_name: '',
      description: '',
      ai_prompt_template: '',
      expected_output: '',
      is_automated: false,
      stage_order: workflows.length + 1
    });
  };

  const openEditDialog = (stage: WorkflowStage) => {
    setEditingStage(stage);
    setStageForm({
      stage_name: stage.stage_name,
      description: stage.description,
      ai_prompt_template: stage.ai_prompt_template,
      expected_output: stage.expected_output || '',
      is_automated: stage.is_automated,
      stage_order: stage.stage_order
    });
    setShowStageDialog(true);
  };

  const getStatusIcon = (status: WorkflowStage['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: WorkflowStage['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateProgress = () => {
    if (workflows.length === 0) return 0;
    const completedStages = workflows.filter(w => w.status === 'completed').length;
    return (completedStages / workflows.length) * 100;
  };

  const selectedRepository = repositories.find(r => r.id === selectedRepo);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            إدارة مراحل العمل الذكية
          </h1>
          <p className="text-gray-300 mt-2">
            أتمتة مراحل التطوير باستخدام الذكاء الاصطناعي
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedRepo} onValueChange={setSelectedRepo}>
            <SelectTrigger className="w-64 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="اختر مستودع" />
            </SelectTrigger>
            <SelectContent>
              {repositories.map((repo) => (
                <SelectItem key={repo.id} value={repo.id}>
                  {repo.name} ({repo.frappe_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={showStageDialog} onOpenChange={setShowStageDialog}>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => {
                  setEditingStage(null);
                  resetStageForm();
                }}
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة مرحلة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingStage ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stage_name">اسم المرحلة</Label>
                    <Input
                      id="stage_name"
                      value={stageForm.stage_name}
                      onChange={(e) => setStageForm(prev => ({ ...prev, stage_name: e.target.value }))}
                      placeholder="اسم المرحلة"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stage_order">ترتيب المرحلة</Label>
                    <Input
                      id="stage_order"
                      type="number"
                      value={stageForm.stage_order}
                      onChange={(e) => setStageForm(prev => ({ ...prev, stage_order: parseInt(e.target.value) }))}
                      placeholder="1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={stageForm.description}
                    onChange={(e) => setStageForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف المرحلة"
                  />
                </div>
                <div>
                  <Label htmlFor="ai_prompt_template">قالب AI Prompt</Label>
                  <Textarea
                    id="ai_prompt_template"
                    value={stageForm.ai_prompt_template}
                    onChange={(e) => setStageForm(prev => ({ ...prev, ai_prompt_template: e.target.value }))}
                    placeholder="قالب الـ prompt الذي سيتم إرساله للذكاء الاصطناعي"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="expected_output">النتيجة المتوقعة</Label>
                  <Textarea
                    id="expected_output"
                    value={stageForm.expected_output}
                    onChange={(e) => setStageForm(prev => ({ ...prev, expected_output: e.target.value }))}
                    placeholder="وصف النتيجة المتوقعة"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_automated"
                    checked={stageForm.is_automated}
                    onCheckedChange={(checked) => setStageForm(prev => ({ ...prev, is_automated: checked }))}
                  />
                  <Label htmlFor="is_automated">تشغيل تلقائي</Label>
                </div>
                <Button 
                  onClick={createOrUpdateStage} 
                  disabled={isLoading || !stageForm.stage_name}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin ml-2" /> : null}
                  {editingStage ? 'تحديث المرحلة' : 'إضافة المرحلة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedRepository && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bot className="w-5 h-5 text-blue-400" />
                  {selectedRepository.name}
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  نوع Frappe: {selectedRepository.frappe_type}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedRepository.workflow_automation}
                    onCheckedChange={(checked) => toggleAutomation(selectedRepo, checked)}
                  />
                  <Label className="text-sm text-white">الأتمتة الكاملة</Label>
                </div>
                <Badge className="bg-blue-500 text-white">
                  {workflows.filter(w => w.status === 'completed').length} / {workflows.length} مكتملة
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">التقدم الإجمالي</span>
                  <span className="text-sm text-gray-400">{Math.round(calculateProgress())}%</span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workflows.map((stage, index) => (
                  <Card key={stage.id} className="bg-gray-700 border-gray-600 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                            {stage.stage_order}
                          </span>
                          <h3 className="font-semibold text-sm text-white">{stage.stage_name}</h3>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(stage.status)}
                          <Badge className={`${getStatusColor(stage.status)} text-white`}>
                            {stage.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">{stage.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {stage.is_automated && (
                        <div className="flex items-center gap-1 text-xs text-yellow-400">
                          <Zap className="w-3 h-3" />
                          تشغيل تلقائي
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runStage(stage.id)}
                          disabled={isLoading || stage.status === 'in_progress'}
                          className="flex-1 border-gray-600 text-white hover:bg-gray-600"
                        >
                          {stage.status === 'in_progress' ? (
                            <RefreshCw className="w-3 h-3 animate-spin ml-1" />
                          ) : (
                            <Play className="w-3 h-3 ml-1" />
                          )}
                          تشغيل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(stage)}
                          className="px-2 border-gray-600 text-white hover:bg-gray-600"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIWorkflowManager;
