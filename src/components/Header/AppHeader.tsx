import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import {
  Brain,
  Settings,
  LogOut,
  User,
  Globe,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Database,
  Server
} from 'lucide-react';

interface ConnectionStatus {
  deepseek: boolean;
  azureOpenAI: boolean;
  server: boolean;
}

interface AppHeaderProps {
  connectionStatus: ConnectionStatus;
  onSettingsClick: () => void;
  onLanguageChange: (lang: 'ar' | 'en') => void;
  currentLanguage: 'ar' | 'en';
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  connectionStatus,
  onSettingsClick,
  onLanguageChange,
  currentLanguage
}) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return true;
  });

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (typeof window !== 'undefined') {
      const theme = newTheme ? 'dark' : 'light';
      localStorage.setItem('theme', theme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  };

  // تطبيق السمة عند التحميل
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const theme = isDarkMode ? 'dark' : 'light';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  }, [isDarkMode]);

  return (
    <header className="h-16 bg-gradient-card border-b border-border px-6 flex items-center justify-between shadow-card-custom">
      {/* Logo and Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-lg shadow-ai">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">DeepSec Pilot</h1>
            <p className="text-sm text-muted-foreground">مساعد البرمجة الذكي • ERP Assistant</p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge 
            variant={connectionStatus.deepseek ? 'default' : 'destructive'}
            className="text-xs flex items-center gap-1"
          >
            {connectionStatus.deepseek ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            DeepSeek
          </Badge>
          
          <Badge 
            variant={connectionStatus.azureOpenAI ? 'default' : 'destructive'}
            className="text-xs flex items-center gap-1"
          >
            {connectionStatus.azureOpenAI ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            Azure AI
          </Badge>
          
          <Badge 
            variant={connectionStatus.server ? 'default' : 'destructive'}
            className="text-xs flex items-center gap-1"
          >
            {connectionStatus.server ? <Server className="w-3 h-3" /> : <Database className="w-3 h-3" />}
            Server
          </Badge>
        </div>

        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLanguageChange(currentLanguage === 'ar' ? 'en' : 'ar')}
          className="flex items-center gap-2"
        >
          <Globe className="w-4 h-4" />
          {currentLanguage === 'ar' ? 'EN' : 'العربية'}
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="flex items-center gap-2"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-56 bg-card border-border" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-sm">مطور النظام</p>
                <p className="w-[200px] truncate text-xs text-muted-foreground">
                  admin@deepsec-pilot.com
                </p>
              </div>
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={onSettingsClick} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>الإعدادات</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="cursor-pointer">
              <Database className="mr-2 h-4 w-4" />
              <span>إدارة قاعدة البيانات</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>تسجيل خروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};