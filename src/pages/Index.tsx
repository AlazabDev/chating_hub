
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ClaudeChatInterface from '@/components/Chat/ClaudeChatInterface';
import GoogleDriveManager from '@/components/FileManager/GoogleDriveManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Folder, Code, GitBranch } from 'lucide-react';

interface ContextFile {
  id: string;
  name: string;
  content: string;
}

const Index = () => {
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<any[]>([]);

  const handleFileSelect = (file: any, content: string) => {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          منصة الذكاء الاصطناعي المتكاملة
        </h1>
        <p className="text-lg text-muted-foreground">
          دردش مع Claude، أدر ملفاتك في Google Drive، وطور مشاريعك بكفاءة
        </p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            المحادثة
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            إدارة الملفات
          </TabsTrigger>
          <TabsTrigger value="repositories" className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            المستودعات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <div className="h-[700px]">
            <ClaudeChatInterface
              contextFiles={contextFiles}
              onFileRequest={handleFileRequest}
            />
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <div className="h-[700px]">
            <GoogleDriveManager
              onFileSelect={handleFileSelect}
              selectedFiles={selectedDriveFiles}
            />
          </div>
        </TabsContent>

        <TabsContent value="repositories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>المستودعات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">مشروع العينة</h3>
                    <Badge variant="secondary">نشط</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    وصف المشروع والمعلومات الأساسية حوله
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">تحديث</Button>
                    <Button variant="outline" size="sm">نشر</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
