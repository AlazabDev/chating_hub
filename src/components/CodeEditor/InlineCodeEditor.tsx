import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Code, 
  Save, 
  X, 
  Edit3, 
  FileText, 
  Download,
  Upload,
  Check,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeFile {
  name: string;
  content: string;
  language: string;
  path: string;
  modified: boolean;
}

interface InlineCodeEditorProps {
  file: CodeFile;
  onSave: (file: CodeFile) => Promise<void>;
  onClose: () => void;
  readOnly?: boolean;
}

export const InlineCodeEditor: React.FC<InlineCodeEditorProps> = ({
  file,
  onSave,
  onClose,
  readOnly = false
}) => {
  const [content, setContent] = useState(file.content);
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsModified(newContent !== file.content);
  };

  const handleSave = async () => {
    if (!isModified) return;
    
    setIsSaving(true);
    try {
      await onSave({
        ...file,
        content,
        modified: true
      });
      
      toast({
        title: "تم الحفظ",
        description: `تم حفظ الملف ${file.name} بنجاح`,
      });
      
      setIsModified(false);
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "فشل في حفظ الملف. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLanguageBadge = (language: string) => {
    const colors: Record<string, string> = {
      typescript: 'bg-blue-600',
      javascript: 'bg-yellow-600',
      python: 'bg-green-600',
      java: 'bg-orange-600',
      csharp: 'bg-purple-600',
      sql: 'bg-red-600',
      json: 'bg-gray-600',
      html: 'bg-orange-500',
      css: 'bg-blue-500'
    };
    
    return (
      <Badge className={`${colors[language] || 'bg-gray-600'} text-white text-xs`}>
        {language.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-code border-code-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-code-border">
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{file.name}</span>
              {getLanguageBadge(file.language)}
              {isModified && (
                <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                  <Edit3 className="w-3 h-3 ml-1" />
                  معدل
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{file.path}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!isModified || isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              حفظ
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            تحميل
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            إغلاق
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {readOnly ? (
          <div className="bg-code border border-code-border rounded-lg p-4">
            <pre className="text-sm text-foreground/90 whitespace-pre-wrap overflow-x-auto">
              <code>{content}</code>
            </pre>
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="min-h-[400px] font-mono text-sm bg-code border-code-border resize-none"
            placeholder="// اكتب الكود هنا..."
            dir="ltr"
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-code-border text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>الأسطر: {content.split('\n').length}</span>
          <span>الأحرف: {content.length}</span>
          <span>اللغة: {file.language}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isModified ? (
            <div className="flex items-center gap-1 text-yellow-500">
              <AlertCircle className="w-3 h-3" />
              <span>غير محفوظ</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-500">
              <Check className="w-3 h-3" />
              <span>محفوظ</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};