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
    <header className="h-16 header-glass px-6 flex items-center justify-between animate-fade-in relative">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-50" />
      
      {/* Logo and Title */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="flex items-center gap-3 animate-scale-in">
          <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-xl shadow-ai hover-glow hover-scale animate-pulse-glow">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="animate-slide-up">
            <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              DeepSec Pilot
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              مساعد البرمجة الذكي • ERP Assistant
            </p>
          </div>
        </div>
      </div>

      {/* Connection Status and Controls */}
      <div className="flex items-center gap-4 relative z-10">
        {/* Connection Status - Enhanced */}
        <div className="flex items-center gap-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Badge 
            variant={connectionStatus.deepseek ? 'default' : 'destructive'}
            className={`text-xs flex items-center gap-1 transition-all duration-300 hover-scale ${
              connectionStatus.deepseek ? 'bg-gradient-to-r from-accent to-accent/80 hover:shadow-glow' : ''
            }`}
          >
            {connectionStatus.deepseek ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            DeepSeek
          </Badge>
          
          <Badge 
            variant={connectionStatus.azureOpenAI ? 'default' : 'destructive'}
            className={`text-xs flex items-center gap-1 transition-all duration-300 hover-scale ${
              connectionStatus.azureOpenAI ? 'bg-gradient-to-r from-primary to-primary-glow hover:shadow-ai' : ''
            }`}
          >
            {connectionStatus.azureOpenAI ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            Azure AI
          </Badge>
          
          <Badge 
            variant={connectionStatus.server ? 'default' : 'destructive'}
            className={`text-xs flex items-center gap-1 transition-all duration-300 hover-scale ${
              connectionStatus.server ? 'bg-gradient-to-r from-secondary to-muted hover:shadow-card' : ''
            }`}
          >
            {connectionStatus.server ? <Server className="w-3 h-3" /> : <Database className="w-3 h-3" />}
            Server
          </Badge>
        </div>

        {/* Control Buttons - Enhanced */}
        <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLanguageChange(currentLanguage === 'ar' ? 'en' : 'ar')}
            className="btn-ghost-enhanced flex items-center gap-2 hover-scale"
          >
            <Globe className="w-4 h-4" />
            <span className="font-medium">{currentLanguage === 'ar' ? 'EN' : 'العربية'}</span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="btn-ghost-enhanced hover-scale relative overflow-hidden"
          >
            <div className="flex items-center gap-2">
              {isDarkMode ? (
                <Sun className="w-4 h-4 transition-transform duration-300 hover:rotate-180" />
              ) : (
                <Moon className="w-4 h-4 transition-transform duration-300 hover:rotate-12" />
              )}
            </div>
          </Button>

          {/* User Menu - Enhanced */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover-scale group">
                <Avatar className="h-10 w-10 transition-all duration-300 group-hover:shadow-ai">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground transition-all duration-300 group-hover:scale-110">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-56 glass-card animate-scale-in p-2" align="end" forceMount>
              <div className="flex items-center justify-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 mb-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">مطور النظام</p>
                  <p className="text-xs text-muted-foreground">
                    admin@deepsec-pilot.com
                  </p>
                </div>
              </div>
              
              <DropdownMenuItem onClick={onSettingsClick} className="cursor-pointer hover:bg-muted/50 transition-all duration-200 hover-lift">
                <Settings className="mr-2 h-4 w-4" />
                <span>الإعدادات</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer hover:bg-muted/50 transition-all duration-200 hover-lift">
                <Database className="mr-2 h-4 w-4" />
                <span>إدارة قاعدة البيانات</span>
              </DropdownMenuItem>
              
              <div className="my-2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              
              <DropdownMenuItem className="cursor-pointer text-destructive hover:bg-destructive/10 transition-all duration-200">
                <LogOut className="mr-2 h-4 w-4" />
                <span>تسجيل خروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};