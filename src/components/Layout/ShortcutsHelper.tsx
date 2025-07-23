import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard, X, Command, Search, Settings } from 'lucide-react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
  category: string;
}

interface ShortcutsHelperProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

const ShortcutsHelper: React.FC<ShortcutsHelperProps> = ({ isOpen, onClose, shortcuts }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(shortcuts.map(s => s.category)))];
  
  const filteredShortcuts = selectedCategory === 'all' 
    ? shortcuts 
    : shortcuts.filter(s => s.category === selectedCategory);

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys = [];
    
    if (shortcut.ctrlKey) {
      keys.push('Ctrl');
    }
    if (shortcut.altKey) {
      keys.push('Alt');
    }
    if (shortcut.shiftKey) {
      keys.push('Shift');
    }
    
    keys.push(shortcut.key.toUpperCase());
    
    return keys;
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'all': return 'جميع الاختصارات';
      case 'navigation': return 'التنقل';
      case 'search': return 'البحث';
      case 'general': return 'عام';
      case 'editing': return 'التحرير';
      default: return category;
    }
  };

  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrlKey: true,
      description: 'فتح البحث العام',
      category: 'search'
    },
    {
      key: 'n',
      ctrlKey: true,
      description: 'فتح الإشعارات',
      category: 'general'
    },
    {
      key: ',',
      ctrlKey: true,
      description: 'فتح الإعدادات',
      category: 'general'
    },
    {
      key: 'd',
      ctrlKey: true,
      description: 'تبديل السمة (فاتح/داكن)',
      category: 'general'
    },
    {
      key: '1',
      ctrlKey: true,
      description: 'التبديل إلى المحادثة',
      category: 'navigation'
    },
    {
      key: '2',
      ctrlKey: true,
      description: 'التبديل إلى المستودعات',
      category: 'navigation'
    },
    {
      key: '3',
      ctrlKey: true,
      description: 'التبديل إلى مراقب الأداء',
      category: 'navigation'
    },
    {
      key: 'n',
      ctrlKey: true,
      shiftKey: true,
      description: 'محادثة جديدة',
      category: 'editing'
    },
    {
      key: '?',
      description: 'عرض هذه القائمة',
      category: 'general'
    },
    {
      key: 'Escape',
      description: 'إغلاق النوافذ المنبثقة',
      category: 'general'
    }
  ];

  const allShortcuts = [...defaultShortcuts, ...shortcuts];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] glass-card">
        <DialogHeader className="pb-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
                <Keyboard className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl">اختصارات لوحة المفاتيح</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  تعلم الاختصارات لتسريع عملك
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex gap-6 h-[60vh]">
          {/* Categories */}
          <div className="w-48 space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground mb-3">الفئات</h3>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                onClick={() => setSelectedCategory(category)}
                className="w-full justify-start text-sm"
              >
                {getCategoryLabel(category)}
              </Button>
            ))}
          </div>

          {/* Shortcuts */}
          <div className="flex-1">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {Object.entries(
                  filteredShortcuts.reduce((acc, shortcut) => {
                    if (!acc[shortcut.category]) {
                      acc[shortcut.category] = [];
                    }
                    acc[shortcut.category].push(shortcut);
                    return acc;
                  }, {} as Record<string, KeyboardShortcut[]>)
                ).map(([category, categoryShortcuts]) => (
                  <div key={category}>
                    {selectedCategory === 'all' && (
                      <h4 className="font-medium text-sm text-muted-foreground mb-3 border-b border-border/30 pb-2">
                        {getCategoryLabel(category)}
                      </h4>
                    )}
                    
                    <div className="space-y-3">
                      {categoryShortcuts.map((shortcut, index) => (
                        <div
                          key={`${shortcut.category}-${index}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{shortcut.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {formatShortcut(shortcut).map((key, keyIndex) => (
                              <React.Fragment key={keyIndex}>
                                <Badge variant="outline" className="text-xs px-2 py-1 font-mono">
                                  {key === 'Ctrl' && '⌘'}
                                  {key === 'Alt' && '⌥'}
                                  {key === 'Shift' && '⇧'}
                                  {!['Ctrl', 'Alt', 'Shift'].includes(key) && key}
                                </Badge>
                                {keyIndex < formatShortcut(shortcut).length - 1 && (
                                  <span className="text-muted-foreground text-xs">+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">⌘</Badge>
                = Ctrl (Windows) أو Cmd (Mac)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>اضغط</span>
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">?</Badge>
              <span>لإظهار هذه القائمة</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutsHelper;