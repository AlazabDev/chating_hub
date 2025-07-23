import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  FolderOpen,
  File,
  Database,
  Server,
  Settings,
  Code,
  Terminal,
  GitBranch,
  Activity,
  Cpu,
  HardDrive,
  Network,
  Shield,
  Users,
  BarChart3,
  Package
} from 'lucide-react';

interface ProjectFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  language?: string;
  size?: number;
  modified?: Date;
  status?: 'modified' | 'added' | 'deleted';
}

interface ServerStatus {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: string;
  status: 'online' | 'offline' | 'maintenance';
}

interface ProjectSidebarProps {
  onFileSelect: (file: ProjectFile) => void;
  onCommandExecute: (command: string) => void;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  onFileSelect,
  onCommandExecute
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'server' | 'erp'>('files');

  // Mock data - في التطبيق الحقيقي ستأتي من API
  const projectFiles: ProjectFile[] = [
    { id: '1', name: 'src', type: 'folder', path: '/src' },
    { id: '2', name: 'components', type: 'folder', path: '/src/components' },
    { id: '3', name: 'App.tsx', type: 'file', path: '/src/App.tsx', language: 'typescript', status: 'modified' },
    { id: '4', name: 'config', type: 'folder', path: '/config' },
    { id: '5', name: 'database.ts', type: 'file', path: '/config/database.ts', language: 'typescript' },
    { id: '6', name: 'server.ts', type: 'file', path: '/server.ts', language: 'typescript', status: 'added' },
  ];

  const serverStatus: ServerStatus = {
    cpu: 45,
    memory: 68,
    disk: 32,
    network: 12,
    uptime: '7d 14h 23m',
    status: 'online'
  };

  const erpModules = [
    { name: 'إدارة المخزون', status: 'active', icon: Package },
    { name: 'المحاسبة', status: 'active', icon: BarChart3 },
    { name: 'إدارة الموظفين', status: 'maintenance', icon: Users },
    { name: 'المبيعات', status: 'active', icon: Activity },
    { name: 'الأمان', status: 'active', icon: Shield },
  ];

  const getFileIcon = (file: ProjectFile) => {
    if (file.type === 'folder') return <FolderOpen className="w-4 h-4 text-accent" />;
    return <File className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'modified': return 'text-yellow-500';
      case 'added': return 'text-green-500';
      case 'deleted': return 'text-red-500';
      default: return '';
    }
  };

  return (
    <div className="w-80 h-full bg-gradient-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground mb-3">لوحة المشروع</h2>
        <div className="flex gap-1">
          <Button
            variant={activeTab === 'files' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('files')}
            className="flex-1"
          >
            <Code className="w-4 h-4 ml-1" />
            الملفات
          </Button>
          <Button
            variant={activeTab === 'server' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('server')}
            className="flex-1"
          >
            <Server className="w-4 h-4 ml-1" />
            السيرفر
          </Button>
          <Button
            variant={activeTab === 'erp' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('erp')}
            className="flex-1"
          >
            <Settings className="w-4 h-4 ml-1" />
            ERP
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                ملفات المشروع
              </h3>
              <div className="space-y-1">
                {projectFiles.map((file) => (
                  <Button
                    key={file.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileSelect(file)}
                    className="w-full justify-start h-auto p-2 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 w-full">
                      {getFileIcon(file)}
                      <span className="flex-1 text-right text-sm">{file.name}</span>
                      {file.status && (
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(file.status)}`} />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                أوامر سريعة
              </h3>
              <div className="space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCommandExecute('npm run build')}
                  className="w-full justify-start text-xs"
                >
                  npm run build
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCommandExecute('git status')}
                  className="w-full justify-start text-xs"
                >
                  git status
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCommandExecute('pm2 restart all')}
                  className="w-full justify-start text-xs"
                >
                  pm2 restart all
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Server Tab */}
        {activeTab === 'server' && (
          <div className="p-4 space-y-4">
            <Card className="p-4 bg-gradient-code border-code-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">حالة السيرفر</h3>
                <Badge 
                  variant={serverStatus.status === 'online' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {serverStatus.status === 'online' ? 'متصل' : 'غير متصل'}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" />
                    <span className="text-sm">CPU</span>
                  </div>
                  <span className="text-sm font-mono">{serverStatus.cpu}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" />
                    <span className="text-sm">الذاكرة</span>
                  </div>
                  <span className="text-sm font-mono">{serverStatus.memory}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">القرص الصلب</span>
                  </div>
                  <span className="text-sm font-mono">{serverStatus.disk}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">الشبكة</span>
                  </div>
                  <span className="text-sm font-mono">{serverStatus.network} Mbps</span>
                </div>
                
                <Separator />
                
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">وقت التشغيل: {serverStatus.uptime}</span>
                </div>
              </div>
            </Card>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">أوامر السيرفر</h3>
              <div className="space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCommandExecute('systemctl status nginx')}
                  className="w-full justify-start text-xs"
                >
                  فحص حالة Nginx
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCommandExecute('docker ps')}
                  className="w-full justify-start text-xs"
                >
                  عرض حاويات Docker
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCommandExecute('tail -f /var/log/app.log')}
                  className="w-full justify-start text-xs"
                >
                  عرض سجلات التطبيق
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ERP Tab */}
        {activeTab === 'erp' && (
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">وحدات النظام</h3>
              <div className="space-y-2">
                {erpModules.map((module, index) => {
                  const IconComponent = module.icon;
                  return (
                    <Card key={index} className="p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{module.name}</span>
                        </div>
                        <Badge 
                          variant={module.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {module.status === 'active' ? 'نشط' : 'صيانة'}
                        </Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">إعدادات سريعة</h3>
              <div className="space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCommandExecute('backup-database')}
                  className="w-full justify-start text-xs"
                >
                  <Database className="w-4 h-4 ml-1" />
                  نسخ احتياطي لقاعدة البيانات
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCommandExecute('sync-erp-modules')}
                  className="w-full justify-start text-xs"
                >
                  <Settings className="w-4 h-4 ml-1" />
                  مزامنة وحدات ERP
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCommandExecute('generate-report')}
                  className="w-full justify-start text-xs"
                >
                  <BarChart3 className="w-4 h-4 ml-1" />
                  إنشاء تقرير شامل
                </Button>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};