
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ClaudeChatInterface from '@/components/Chat/ClaudeChatInterface';
import EnhancedAIChat from '@/components/Chat/EnhancedAIChat';
import GoogleDriveManager from '@/components/FileManager/GoogleDriveManager';
import { ProjectSidebar } from '@/components/Sidebar/ProjectSidebar';
import { AdvancedCodeEditor } from '@/components/CodeEditor/AdvancedCodeEditor';
import RepositoryManager from '@/components/Repository/RepositoryManager';
import DashboardAnalytics from '@/components/Analytics/DashboardAnalytics';
import SystemSettings from '@/components/Settings/SystemSettings';
import ProductionDashboard from '@/components/Production/ProductionDashboard';
import AIStatusOverview from '@/components/AI/AIStatusOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Folder, Code, GitBranch, Terminal, Settings, BarChart3, Zap, Rocket, Activity } from 'lucide-react';
import { AIConnectionTester } from '@/components/AI/AIConnectionTester';

interface ContextFile {
  id: string;
  name: string;
  content: string;
}

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

const Index = () => {
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<any[]>([]);
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  const handleDriveFileSelect = (file: any, content: string) => {
    const contextFile: ContextFile = {
      id: file.id,
      name: file.name,
      content
    };

    if (!contextFiles.find(f => f.id === file.id)) {
      setContextFiles(prev => [...prev, contextFile]);
      setSelectedDriveFiles(prev => [...prev, file]);
    }
  };

  const handleFileRequest = () => {
    // This will focus the Google Drive tab
    // In a more complete implementation, you could open a modal or switch tabs
  };

  const handleProjectFileSelect = (file: ProjectFile) => {
    console.log('Selected file:', file);
    if (file.type === 'file') {
      setShowCodeEditor(true);
    }
  };

  const handleCommandExecute = (command: string) => {
    console.log('Executing command:', command);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ProjectSidebar 
        onFileSelect={handleProjectFileSelect}
        onCommandExecute={handleCommandExecute}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-card">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              منصة الذكاء الاصطناعي المتكاملة
            </h1>
            <p className="text-muted-foreground">
              دردش مع Claude، أدر ملفاتك في Google Drive، وطور مشاريعك بكفاءة
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6">
          {showCodeEditor ? (
            <AdvancedCodeEditor onClose={() => setShowCodeEditor(false)} />
          ) : (
            <Tabs defaultValue="chat" className="h-full">
              <TabsList className="grid w-full grid-cols-9 mb-6">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Claude
                </TabsTrigger>
                <TabsTrigger value="ai-chat" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  ذكاء متقدم
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  إدارة الملفات
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center gap-2" onClick={() => setShowCodeEditor(true)}>
                  <Code className="w-4 h-4" />
                  محرر الكود
                </TabsTrigger>
                <TabsTrigger value="repositories" className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  المستودعات
                </TabsTrigger>
                <TabsTrigger value="production" className="flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  الإنتاج
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  التحليلات
                </TabsTrigger>
                <TabsTrigger value="ai-status" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  حالة الذكاء
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  الإعدادات
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="h-full">
                <div className="h-full">
                  <ClaudeChatInterface
                    contextFiles={contextFiles}
                    onFileRequest={handleFileRequest}
                  />
                </div>
              </TabsContent>

              <TabsContent value="ai-chat" className="h-full">
                <div className="h-full">
                  <EnhancedAIChat />
                </div>
              </TabsContent>

              <TabsContent value="files" className="h-full">
                <div className="h-full">
                  <GoogleDriveManager
                    onFileSelect={handleDriveFileSelect}
                    selectedFiles={selectedDriveFiles}
                  />
                </div>
              </TabsContent>

              <TabsContent value="code" className="h-full">
                {/* This will be handled by the showCodeEditor state */}
              </TabsContent>

              <TabsContent value="repositories" className="h-full">
                <RepositoryManager />
              </TabsContent>

              <TabsContent value="production" className="h-full">
                <ProductionDashboard />
              </TabsContent>

              <TabsContent value="analytics" className="h-full">
                <DashboardAnalytics />
              </TabsContent>

              <TabsContent value="ai-status" className="h-full">
                <AIStatusOverview />
              </TabsContent>

              <TabsContent value="settings" className="h-full">
                <SystemSettings />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
