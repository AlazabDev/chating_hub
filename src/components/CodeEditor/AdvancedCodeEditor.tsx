import React, { useState } from 'react';
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

interface CodeFile {
  id: string;
  name: string;
  content: string;
  language: string;
  path: string;
  modified: boolean;
}

interface AdvancedCodeEditorProps {
  onClose?: () => void;
}

export const AdvancedCodeEditor: React.FC<AdvancedCodeEditorProps> = ({ onClose }) => {
  const [files, setFiles] = useState<CodeFile[]>([
    {
      id: '1',
      name: 'main.tsx',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`,
      language: 'typescript',
      path: 'src/main.tsx',
      modified: false
    }
  ]);
  
  const [activeFileId, setActiveFileId] = useState<string>('1');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const activeFile = files.find(f => f.id === activeFileId);

  const handleContentChange = (newContent: string) => {
    if (!activeFile) return;
    
    setFiles(prev => prev.map(file => 
      file.id === activeFileId 
        ? { ...file, content: newContent, modified: true }
        : file
    ));
  };

  const handleSave = async () => {
    if (!activeFile) return;
    
    try {
      // محاكاة حفظ الملف
      setFiles(prev => prev.map(file => 
        file.id === activeFileId 
          ? { ...file, modified: false }
          : file
      ));
      
      toast({
        title: "تم الحفظ",
        description: `تم حفظ ${activeFile.name} بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "فشل في حفظ الملف",
        variant: "destructive"
      });
    }
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

  const handleNewFile = () => {
    const newFile: CodeFile = {
      id: Date.now().toString(),
      name: 'untitled.js',
      content: '// ملف جديد\nconsole.log("مرحبا بالعالم!");',
      language: 'javascript',
      path: 'src/untitled.js',
      modified: true
    };
    
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

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
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewFile}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            ملف جديد
          </Button>
          
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

      {/* File Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
        <ScrollArea className="flex-1">
          <div className="flex gap-1">
            {files.map((file) => (
              <Button
                key={file.id}
                variant={activeFileId === file.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveFileId(file.id)}
                className="flex items-center gap-2 min-w-0"
              >
                <FileText className="w-4 h-4" />
                <span className="truncate max-w-32">{file.name}</span>
                {file.modified && (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>
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
        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {activeFile && (
            <>
              {/* File Info */}
              <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{activeFile.name}</span>
                  {getLanguageBadge(activeFile.language)}
                  {activeFile.modified && (
                    <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                      <Edit3 className="w-3 h-3 ml-1" />
                      معدل
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{activeFile.path}</span>
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
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="w-3 h-3" />
                  <span>UTF-8</span>
                </div>
              </div>
            </>
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