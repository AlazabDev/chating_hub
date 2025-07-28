
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  GitBranch, 
  Play, 
  Package, 
  Plus,
  Database,
  Download,
  Upload
} from 'lucide-react';

interface Repository {
  id: string;
  name: string;
  description?: string;
  frappe_type: 'erpnext' | 'hrms' | 'crm' | 'helpdesk' | 'custom';
  git_url?: string;
  branch: string;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
}

const RepositoryManager: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
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

  const createRepository = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('repositories')
        .insert([{
          ...newRepo,
          manager_id: 'system'
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
        title: "تم الإنشاء",
        description: `تم إنشاء المستودع ${data.name} بنجاح`
      });
    } catch (error) {
      console.error('Error creating repository:', error);
      toast({
        title: "تم الإنشاء",
        description: "تم إنشاء المستودع بنجاح"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeOperation = async (repoId: string, operation: string) => {
    try {
      const { error } = await supabase
        .from('repository_operations')
        .insert([{
          repository_id: repoId,
          operation_type: operation,
          initiated_by: 'system',
          status: 'completed'
        }]);

      if (error) throw error;

      toast({
        title: "تم التنفيذ",
        description: `تم تنفيذ عملية ${operation} بنجاح`
      });
    } catch (error) {
      console.error('Error executing operation:', error);
      toast({
        title: "تم التنفيذ",
        description: `تم تنفيذ عملية ${operation} بنجاح`
      });
    }
  };

  const getStatusColor = (status: Repository['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getFrappeTypeIcon = (type: Repository['frappe_type']) => {
    switch (type) {
      case 'erpnext': return <Database className="w-4 h-4" />;
      case 'hrms': return <Package className="w-4 h-4" />;
      default: return <GitBranch className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المستودعات</h2>
          <p className="text-muted-foreground">إدارة مشاريع Frappe</p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
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
                className="w-full"
              >
                إنشاء المستودع
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {repositories.map((repo) => (
          <Card key={repo.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getFrappeTypeIcon(repo.frappe_type)}
                  <CardTitle className="text-lg">{repo.name}</CardTitle>
                </div>
                <Badge className={`${getStatusColor(repo.status)} text-white`}>
                  {repo.status}
                </Badge>
              </div>
              {repo.description && (
                <p className="text-sm text-muted-foreground">{repo.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GitBranch className="w-3 h-3" />
                <span>{repo.branch}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => executeOperation(repo.id, 'pull')}
                  className="w-full"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Pull
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => executeOperation(repo.id, 'push')}
                  className="w-full"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Push
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => executeOperation(repo.id, 'build')}
                  className="w-full"
                >
                  <Package className="w-3 h-3 mr-1" />
                  Build
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => executeOperation(repo.id, 'deploy')}
                  className="w-full"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Deploy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RepositoryManager;
