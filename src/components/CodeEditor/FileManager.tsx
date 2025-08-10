import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Folder, 
  FileText, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  Edit3, 
  Search,
  FolderOpen,
  Code,
  Image,
  Video,
  Music
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
}

interface FileManagerProps {
  onFileSelect: (file: CodeFile) => void;
  selectedFileId?: string;
}

export const FileManager: React.FC<FileManagerProps> = ({ onFileSelect, selectedFileId }) => {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const { toast } = useToast();
  const { user } = useAuth();

  const languages = [
    { id: 'javascript', name: 'JavaScript', ext: '.js' },
    { id: 'typescript', name: 'TypeScript', ext: '.ts' },
    { id: 'react', name: 'React TSX', ext: '.tsx' },
    { id: 'html', name: 'HTML', ext: '.html' },
    { id: 'css', name: 'CSS', ext: '.css' },
    { id: 'python', name: 'Python', ext: '.py' },
    { id: 'json', name: 'JSON', ext: '.json' },
    { id: 'markdown', name: 'Markdown', ext: '.md' }
  ];

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_code_files')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error('Error loading files:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الملفات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createFile = async () => {
    if (!newFileName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الملف",
        variant: "destructive",
      });
      return;
    }

    const language = languages.find(l => l.id === selectedLanguage);
    const fullFileName = newFileName.includes('.') ? newFileName : newFileName + (language?.ext || '.txt');

    try {
      const { data, error } = await supabase
        .from('project_code_files')
        .insert({
          user_id: user?.id,
          file_name: fullFileName,
          file_path: `src/${fullFileName}`,
          content: getDefaultContent(selectedLanguage),
          language: selectedLanguage,
          size_bytes: 0,
          is_public: false
        })
        .select()
        .single();

      if (error) throw error;

      setFiles(prev => [data, ...prev]);
      setNewFileName('');
      setIsCreating(false);
      onFileSelect(data);
      
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الملف بنجاح",
      });
    } catch (error: any) {
      console.error('Error creating file:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الملف",
        variant: "destructive",
      });
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('project_code_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      setFiles(prev => prev.filter(f => f.id !== fileId));
      
      toast({
        title: "تم الحذف",
        description: "تم حذف الملف بنجاح",
      });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الملف",
        variant: "destructive",
      });
    }
  };

  const getDefaultContent = (language: string): string => {
    const templates: Record<string, string> = {
      javascript: `console.log('مرحبا بالعالم!');`,
      typescript: `console.log('مرحبا بالعالم!');\n\ninterface User {\n  name: string;\n  age: number;\n}`,
      react: `import React from 'react';\n\nconst Component: React.FC = () => {\n  return (\n    <div>\n      <h1>مرحبا بالعالم!</h1>\n    </div>\n  );\n};\n\nexport default Component;`,
      html: `<!DOCTYPE html>\n<html lang="ar">\n<head>\n  <meta charset="UTF-8">\n  <title>صفحة جديدة</title>\n</head>\n<body>\n  <h1>مرحبا بالعالم!</h1>\n</body>\n</html>`,
      css: `/* ملف CSS جديد */\nbody {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n}`,
      python: `print("مرحبا بالعالم!")\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()`,
      json: `{\n  "name": "مشروع جديد",\n  "version": "1.0.0",\n  "description": "وصف المشروع"\n}`,
      markdown: `# عنوان المستند\n\nهذا مستند Markdown جديد.\n\n## قسم فرعي\n\n- نقطة أولى\n- نقطة ثانية\n- نقطة ثالثة`
    };
    
    return templates[language] || '// ملف جديد';
  };

  const getFileIcon = (language: string) => {
    const icons: Record<string, any> = {
      javascript: Code,
      typescript: Code,
      react: Code,
      html: FileText,
      css: FileText,
      python: Code,
      json: FileText,
      markdown: FileText
    };
    
    const Icon = icons[language] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const getLanguageColor = (language: string): string => {
    const colors: Record<string, string> = {
      javascript: 'bg-yellow-500',
      typescript: 'bg-blue-500',
      react: 'bg-cyan-500',
      html: 'bg-orange-500',
      css: 'bg-blue-600',
      python: 'bg-green-500',
      json: 'bg-gray-500',
      markdown: 'bg-purple-500'
    };
    
    return colors[language] || 'bg-gray-400';
  };

  const filteredFiles = files.filter(file =>
    file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.file_path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">يرجى تسجيل الدخول لإدارة الملفات</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            إدارة الملفات
          </CardTitle>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                ملف جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء ملف جديد</DialogTitle>
                <DialogDescription>
                  اختر نوع الملف واسمه
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">نوع الملف</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full p-2 border rounded-md mt-1"
                  >
                    {languages.map(lang => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name} ({lang.ext})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">اسم الملف</label>
                  <Input
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="مثال: component"
                    className="mt-1"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={createFile} className="flex-1">
                    إنشاء الملف
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex items-center gap-2 mt-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث في الملفات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              جاري تحميل الملفات...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'لا توجد ملفات تطابق البحث' : 'لا توجد ملفات بعد'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedFileId === file.id ? 'bg-primary/10 border-primary' : 'border-border'
                  }`}
                  onClick={() => onFileSelect(file)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(file.language)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{file.file_name}</p>
                          <Badge 
                            className={`${getLanguageColor(file.language)} text-white text-xs`}
                          >
                            {file.language.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {file.file_path}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size_bytes)} • {new Date(file.updated_at).toLocaleDateString('ar')}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file.id);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};