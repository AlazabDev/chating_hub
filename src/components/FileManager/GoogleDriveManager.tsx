import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Folder, 
  FileText, 
  Plus, 
  Download, 
  Edit, 
  Trash2, 
  Upload,
  FolderPlus,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
}

interface GoogleDriveManagerProps {
  onFileSelect?: (file: DriveFile, content: string) => void;
  selectedFiles?: DriveFile[];
}

const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({
  onFileSelect,
  selectedFiles = []
}) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, [currentFolder]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-files', {
        body: {
          action: 'list',
          parentId: currentFolder
        }
      });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الملفات من Google Drive",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = async (file: DriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      setCurrentFolder(file.id);
      setFolderPath(prev => [...prev, { id: file.id, name: file.name }]);
    } else {
      // Load file content for selection
      try {
        const { data, error } = await supabase.functions.invoke('google-drive-files', {
          body: {
            action: 'download',
            fileId: file.id
          }
        });

        if (error) throw error;
        if (onFileSelect) {
          onFileSelect(file, data.content);
        }
      } catch (error) {
        console.error('Error downloading file:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحميل محتوى الملف",
          variant: "destructive"
        });
      }
    }
  };

  const handleEditFile = async (file: DriveFile) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-files', {
        body: {
          action: 'download',
          fileId: file.id
        }
      });

      if (error) throw error;
      setSelectedFile(file);
      setFileContent(data.content);
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error('Error loading file for edit:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الملف للتعديل",
        variant: "destructive"
      });
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;

    try {
      const { error } = await supabase.functions.invoke('google-drive-files', {
        body: {
          action: 'update',
          fileId: selectedFile.id,
          content: fileContent
        }
      });

      if (error) throw error;
      
      setIsEditDialogOpen(false);
      loadFiles();
      toast({
        title: "تم الحفظ",
        description: "تم حفظ التغييرات بنجاح"
      });
    } catch (error) {
      console.error('Error saving file:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الملف",
        variant: "destructive"
      });
    }
  };

  const handleCreateNew = async () => {
    if (!newFileName.trim()) return;

    try {
      const action = createType === 'folder' ? 'create-folder' : 'upload';
      const { error } = await supabase.functions.invoke('google-drive-files', {
        body: {
          action,
          fileName: newFileName,
          content: createType === 'file' ? newFileContent : undefined,
          parentId: currentFolder
        }
      });

      if (error) throw error;
      
      setIsCreateDialogOpen(false);
      setNewFileName('');
      setNewFileContent('');
      loadFiles();
      toast({
        title: "تم الإنشاء",
        description: `تم إنشاء ${createType === 'folder' ? 'المجلد' : 'الملف'} بنجاح`
      });
    } catch (error) {
      console.error('Error creating:', error);
      toast({
        title: "خطأ",
        description: "فشل في الإنشاء",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFile = async (file: DriveFile) => {
    if (!confirm(`هل أنت متأكد من حذف "${file.name}"؟`)) return;

    try {
      const { error } = await supabase.functions.invoke('google-drive-files', {
        body: {
          action: 'delete',
          fileId: file.id
        }
      });

      if (error) throw error;
      
      loadFiles();
      toast({
        title: "تم الحذف",
        description: "تم حذف الملف بنجاح"
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الملف",
        variant: "destructive"
      });
    }
  };

  const navigateUp = () => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      setCurrentFolder(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
    }
  };

  const formatFileSize = (size?: string) => {
    if (!size) return '';
    const bytes = parseInt(size);
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
  };

  const isFileSelected = (file: DriveFile) => {
    return selectedFiles.some(f => f.id === file.id);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Google Drive
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadFiles}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إنشاء {createType === 'folder' ? 'مجلد' : 'ملف'} جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={createType === 'file' ? 'default' : 'outline'}
                      onClick={() => setCreateType('file')}
                    >
                      ملف
                    </Button>
                    <Button
                      variant={createType === 'folder' ? 'default' : 'outline'}
                      onClick={() => setCreateType('folder')}
                    >
                      مجلد
                    </Button>
                  </div>
                  <Input
                    placeholder={`اسم ${createType === 'folder' ? 'المجلد' : 'الملف'}`}
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                  />
                  {createType === 'file' && (
                    <Textarea
                      placeholder="محتوى الملف"
                      value={newFileContent}
                      onChange={(e) => setNewFileContent(e.target.value)}
                      rows={10}
                    />
                  )}
                  <Button onClick={handleCreateNew} className="w-full">
                    إنشاء
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 text-sm">
          {folderPath.length > 0 && (
            <Button variant="ghost" size="sm" onClick={navigateUp}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <span className="text-muted-foreground">
            الجذر {folderPath.map(f => ` / ${f.name}`).join('')}
          </span>
        </div>

        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium">الملفات المحددة:</span>
            {selectedFiles.map((file) => (
              <Badge key={file.id} variant="secondary" className="text-xs">
                {file.name}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className={`flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors ${
                  isFileSelected(file) ? 'bg-primary/10 border-primary' : ''
                }`}
                onClick={() => handleFileClick(file)}
              >
                <div className="flex items-center gap-3">
                  {file.mimeType === 'application/vnd.google-apps.folder' ? (
                    <Folder className="w-5 h-5 text-blue-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(file.modifiedTime).toLocaleDateString('ar-SA')}
                      {file.size && ` • ${formatFileSize(file.size)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {file.mimeType !== 'application/vnd.google-apps.folder' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFile(file);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {files.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="w-12 h-12 mx-auto mb-4" />
                <p>لا توجد ملفات في هذا المجلد</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Edit File Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>تعديل: {selectedFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              rows={20}
              className="font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveFile}>
                حفظ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GoogleDriveManager;