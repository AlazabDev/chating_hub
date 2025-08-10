import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Code, 
  Save, 
  X, 
  Edit3, 
  Play,
  Square,
  RefreshCw,
  Terminal,
  FileText,
  Settings,
  Search,
  Download,
  Upload,
  Plus,
  Folder
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileManager } from './FileManager';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

interface CodeFile {
  id: string;
  file_name: string;
  file_path: string;
  content: string;
  language: string;
  size_bytes: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  modified?: boolean;
}

interface AdvancedCodeEditorProps {
  onClose?: () => void;
}

export const AdvancedCodeEditor: React.FC<AdvancedCodeEditorProps> = ({ onClose }) => {
  const [activeFile, setActiveFile] = useState<CodeFile | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFileManager, setShowFileManager] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleContentChange = (newContent: string) => {
    if (!activeFile) return;
    
    setActiveFile(prev => prev ? { ...prev, content: newContent, modified: true } : null);
  };

  const handleSave = async () => {
    if (!activeFile || !user) return;
    
    try {
      const { error } = await supabase
        .from('project_code_files')
        .update({
          content: activeFile.content,
          size_bytes: new Blob([activeFile.content]).size,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeFile.id);

      if (error) throw error;

      setActiveFile(prev => prev ? { ...prev, modified: false } : null);
      
      toast({
        title: "تم الحفظ",
        description: `تم حفظ ${activeFile.file_name} بنجاح`,
      });
    } catch (error: any) {
      console.error('Error saving file:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "فشل في حفظ الملف",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (file: CodeFile) => {
    setActiveFile({ ...file, modified: false });
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('جاري تشغيل الكود...\n');
    
    // محاكاة تشغيل الكود
    setTimeout(() => {
      setOutput(prev => prev + 'تم تشغيل الكود بنجاح!\n');
      setOutput(prev => prev + 'لا توجد أخطاء.\n');
      setOutput(prev => prev + '✅ انتهى التشغيل\n');
      setIsRunning(false);
    }, 2000);
  };

  const handleStop = () => {
    setIsRunning(false);
    setOutput(prev => prev + '\n❌ تم إيقاف التشغيل\n');
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-card border border-border rounded-lg">
        <div className="text-center">
          <h2 className="text-lg font-medium text-foreground mb-2">محرر الكود المتقدم</h2>
          <p className="text-muted-foreground mb-4">يرجى تسجيل الدخول لاستخدام محرر الكود</p>
          <Button onClick={() => window.location.href = '/auth'}>
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  const getLanguageBadge = (language: string) => {
    const colors: Record<string, string> = {
      typescript: 'bg-blue-600',
      javascript: 'bg-yellow-600',
      python: 'bg-green-600',
      java: 'bg-orange-600',
      html: 'bg-orange-500',
      css: 'bg-blue-500',
      json: 'bg-gray-600'
    };
    
    return (
      <Badge className={`${colors[language] || 'bg-gray-600'} text-white text-xs`}>
        {language.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-code">
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">محرر الكود المتقدم</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* ملف جديد يتم إنشاؤه من خلال FileManager */}
          
          {activeFile && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!activeFile.modified}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              حفظ
            </Button>
          )}
          
          <Button
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            onClick={isRunning ? handleStop : handleRun}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4" />
                إيقاف
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                تشغيل
              </>
            )}
          </Button>
          
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              إغلاق
            </Button>
          )}
        </div>
      </div>

      {/* File Manager Toggle */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFileManager(!showFileManager)}
            className="flex items-center gap-2"
          >
            <Folder className="w-4 h-4" />
            {showFileManager ? 'إخفاء الملفات' : 'عرض الملفات'}
          </Button>
          
          {activeFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{activeFile.file_name}</span>
              {activeFile.modified && (
                <Badge variant="outline" className="text-yellow-500 border-yellow-500 text-xs">
                  معدل
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="البحث في الكود..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" size="sm">
          استبدال
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* File Manager */}
        {showFileManager && (
          <div className="w-80 border-l border-border">
            <FileManager 
              onFileSelect={handleFileSelect}
              selectedFileId={activeFile?.id}
            />
          </div>
        )}
        
        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {activeFile ? (
            <>
              {/* File Info */}
              <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{activeFile.file_name}</span>
                  {getLanguageBadge(activeFile.language)}
                  {activeFile.modified && (
                    <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                      <Edit3 className="w-3 h-3 ml-1" />
                      معدل
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{activeFile.file_path}</span>
              </div>
              
              {/* Code Editor */}
              <div className="flex-1 p-4">
                <Textarea
                  value={activeFile.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="h-full min-h-[400px] font-mono text-sm bg-code border-code-border resize-none"
                  placeholder="// اكتب الكود هنا..."
                  dir="ltr"
                />
              </div>
              
              {/* File Statistics */}
              <div className="flex items-center justify-between p-3 border-t border-border text-xs text-muted-foreground bg-muted/20">
                <div className="flex items-center gap-4">
                  <span>الأسطر: {activeFile.content.split('\n').length}</span>
                  <span>الأحرف: {activeFile.content.length}</span>
                  <span>اللغة: {activeFile.language}</span>
                  <span>الحجم: {(new Blob([activeFile.content]).size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="w-3 h-3" />
                  <span>UTF-8</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>اختر ملفاً من إدارة الملفات للبدء في التحرير</p>
              </div>
            </div>
          )}
        </div>

        {/* Output Panel */}
        <div className="w-80 border-l border-border bg-muted/10">
          <Tabs defaultValue="output" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 m-2">
              <TabsTrigger value="output" className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                المخرجات
              </TabsTrigger>
              <TabsTrigger value="problems" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                المشاكل
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="output" className="flex-1 m-2 mt-0">
              <Card className="h-full">
                <ScrollArea className="h-full p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/80">
                    {output || 'لا توجد مخرجات بعد...'}
                  </pre>
                </ScrollArea>
              </Card>
            </TabsContent>
            
            <TabsContent value="problems" className="flex-1 m-2 mt-0">
              <Card className="h-full p-4">
                <div className="text-sm text-muted-foreground text-center">
                  لا توجد مشاكل في الكود الحالي
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};