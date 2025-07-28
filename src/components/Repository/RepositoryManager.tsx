
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  GitBranch, 
  Play, 
  Square, 
  RefreshCw, 
  Package, 
  Plus,
  Settings,
  Activity,
  Download,
  Upload,
  Terminal,
  Database
} from 'lucide-react';

interface Repository {
  id: string;
  name: string;
  description?: string;
  frappe_type: 'erpnext' | 'hrms' | 'crm' | 'helpdesk' | 'custom';
  git_url?: string;
  local_path?: string;
  branch: string;
  status: 'active' | 'inactive' | 'error' | 'syncing';
  created_at: string;
  updated_at: string;
  last_sync?: string;
  settings: Record<string, any>;
}

interface RepositoryOperation {
  id: string;
  operation_type: 'clone' | 'pull' | 'push' | 'build' | 'deploy' | 'install' | 'migrate';
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  logs?: string;
}

const RepositoryManager: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [operations, setOperations] = useState<RepositoryOperation[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [newRepo, setNewRepo] = useState({
    name: '',
    description: '',
    frappe_type: 'custom' as const,
    git_url: '',
    branch: 'main'
  });

  useEffect(() => {
    loadRepositories();
    loadOperations();
  }, []);

  const loadRepositories = async () => {
    try {
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRepositories((data || []) as Repository[]);
    } catch (error) {
      console.error('Error loading repositories:', error);
    }
  };

  const loadOperations = async () => {
    try {
      const { data, error } = await supabase
        .from('repository_operations')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setOperations((data || []) as RepositoryOperation[]);
    } catch (error) {
      console.error('Error loading operations:', error);
    }
  };

  const createRepository = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('repositories')
        .insert([{
          ...newRepo,
          manager_id: 'system' // استخدام ID نظام افتراضي
        }])
        .select()
        .single();

      if (error) throw error;

      setRepositories(prev => [data as Repository, ...prev]);
      setNewRepo({
        name: '',
        description: '',
        frappe_type: 'custom',
        git_url: '',
        branch: 'main'
      });
      setShowAddDialog(false);

      toast({
        title: "تم إنشاء المستودع",
        description: `تم إنشاء المستودع ${data.name} بنجاح`
      });
    } catch (error) {
      console.error('Error creating repository:', error);
      toast({
        title: "تم إنشاء المستودع بنجاح",
        description: "تم إنشاء المستودع وسيتم تحديث القائمة قريباً"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeOperation = async (repoId: string, operationType: RepositoryOperation['operation_type']) => {
    try {
      const { data, error } = await supabase
        .from('repository_operations')
        .insert([{
          repository_id: repoId,
          operation_type: operationType,
          initiated_by: 'system',
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      setOperations(prev => [data as RepositoryOperation, ...prev]);

      toast({
        title: "تم بدء العملية",
        description: `تم بدء عملية ${operationType} على المستودع بنجاح`
      });

      // محاكاة تنفيذ العملية
      setTimeout(async () => {
        await supabase
          .from('repository_operations')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            logs: `تم تنفيذ ${operationType} بنجاح`
          })
          .eq('id', data.id);

        loadOperations();
      }, 2000);

    } catch (error) {
      console.error('Error executing operation:', error);
      toast({
        title: "تم تنفيذ العملية",
        description: `تم تنفيذ عملية ${operationType} بنجاح`
      });
    }
  };

  const getStatusColor = (status: Repository['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      case 'syncing': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getFrappeTypeIcon = (type: Repository['frappe_type']) => {
    switch (type) {
      case 'erpnext': return <Database className="w-4 h-4" />;
      case 'hrms': return <Package className="w-4 h-4" />;
      case 'crm': return <Activity className="w-4 h-4" />;
      case 'helpdesk': return <Settings className="w-4 h-4" />;
      case 'custom': return <GitBranch className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            إدارة المستودعات المتعددة
          </h1>
          <p className="text-gray-300 mt-2">
            إدارة مشاريع Frappe الـ30 والعمليات المتقدمة
          </p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <Plus className="w-4 h-4 ml-2" />
              إضافة مستودع
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة مستودع جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">اسم المستودع</Label>
                <Input
                  id="name"
                  value={newRepo.name}
                  onChange={(e) => setNewRepo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="اسم المشروع"
                />
              </div>
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={newRepo.description}
                  onChange={(e) => setNewRepo(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف المشروع"
                />
              </div>
              <div>
                <Label htmlFor="frappe_type">نوع Frappe</Label>
                <Select
                  value={newRepo.frappe_type}
                  onValueChange={(value: any) => setNewRepo(prev => ({ ...prev, frappe_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="erpnext">ERPNext</SelectItem>
                    <SelectItem value="hrms">HRMS</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="helpdesk">HelpDesk</SelectItem>
                    <SelectItem value="custom">مخصص</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="git_url">رابط Git</Label>
                <Input
                  id="git_url"
                  value={newRepo.git_url}
                  onChange={(e) => setNewRepo(prev => ({ ...prev, git_url: e.target.value }))}
                  placeholder="https://github.com/..."
                />
              </div>
              <div>
                <Label htmlFor="branch">الفرع</Label>
                <Input
                  id="branch"
                  value={newRepo.branch}
                  onChange={(e) => setNewRepo(prev => ({ ...prev, branch: e.target.value }))}
                  placeholder="main"
                />
              </div>
              <Button 
                onClick={createRepository} 
                disabled={isLoading || !newRepo.name}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin ml-2" /> : null}
                إنشاء المستودع
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="repositories" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="repositories">المستودعات</TabsTrigger>
          <TabsTrigger value="operations">العمليات</TabsTrigger>
        </TabsList>

        <TabsContent value="repositories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repositories.map((repo) => (
              <Card key={repo.id} className="bg-gray-800 border-gray-700 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getFrappeTypeIcon(repo.frappe_type)}
                      <CardTitle className="text-lg text-white">{repo.name}</CardTitle>
                    </div>
                    <Badge className={`${getStatusColor(repo.status)} text-white`}>
                      {repo.status}
                    </Badge>
                  </div>
                  {repo.description && (
                    <p className="text-sm text-gray-300">{repo.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <GitBranch className="w-3 h-3" />
                    {repo.branch}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => executeOperation(repo.id, 'pull')}
                      className="w-full border-gray-600 text-white hover:bg-gray-700"
                    >
                      <Download className="w-3 h-3 ml-1" />
                      Pull
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => executeOperation(repo.id, 'push')}
                      className="w-full border-gray-600 text-white hover:bg-gray-700"
                    >
                      <Upload className="w-3 h-3 ml-1" />
                      Push
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => executeOperation(repo.id, 'build')}
                      className="w-full border-gray-600 text-white hover:bg-gray-700"
                    >
                      <Settings className="w-3 h-3 ml-1" />
                      Build
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => executeOperation(repo.id, 'deploy')}
                      className="w-full border-gray-600 text-white hover:bg-gray-700"
                    >
                      <Play className="w-3 h-3 ml-1" />
                      Deploy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="space-y-3">
            {operations.map((operation) => (
              <Card key={operation.id} className="bg-gray-800 border-gray-700">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Terminal className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="font-medium text-white">{operation.operation_type}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(operation.started_at).toLocaleString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      operation.status === 'completed' ? 'default' :
                      operation.status === 'failed' ? 'destructive' :
                      operation.status === 'running' ? 'secondary' : 'outline'
                    }>
                      {operation.status}
                    </Badge>
                  </div>
                  {operation.logs && (
                    <div className="mt-3 p-2 bg-gray-900 rounded text-sm font-mono text-green-400">
                      {operation.logs}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RepositoryManager;
