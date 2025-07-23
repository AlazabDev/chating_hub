import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Sun, Moon, Monitor, Brush, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ThemeSettingsProps {
  themeSettings: {
    mode: 'light' | 'dark' | 'system';
    colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
    fontSize: 'small' | 'medium' | 'large';
    borderRadius: 'none' | 'small' | 'medium' | 'large';
  };
  onThemeSettingsChange: (settings: any) => void;
}

const colorSchemes = {
  blue: { name: 'الأزرق', primary: 'hsl(217, 91%, 60%)', accent: 'hsl(142, 76%, 36%)' },
  green: { name: 'الأخضر', primary: 'hsl(142, 76%, 36%)', accent: 'hsl(217, 91%, 60%)' },
  purple: { name: 'البنفسجي', primary: 'hsl(270, 91%, 60%)', accent: 'hsl(30, 91%, 60%)' },
  orange: { name: 'البرتقالي', primary: 'hsl(25, 95%, 53%)', accent: 'hsl(217, 91%, 60%)' },
  pink: { name: 'الوردي', primary: 'hsl(330, 81%, 60%)', accent: 'hsl(142, 76%, 36%)' }
};

const fontSizes = {
  small: { name: 'صغير', value: '14px' },
  medium: { name: 'متوسط', value: '16px' },
  large: { name: 'كبير', value: '18px' }
};

const borderRadiuses = {
  none: { name: 'بدون', value: '0px' },
  small: { name: 'صغير', value: '4px' },
  medium: { name: 'متوسط', value: '8px' },
  large: { name: 'كبير', value: '12px' }
};

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({
  themeSettings,
  onThemeSettingsChange
}) => {
  const { toast } = useToast();

  const applyColorScheme = (scheme: string) => {
    const colors = colorSchemes[scheme as keyof typeof colorSchemes];
    if (colors) {
      document.documentElement.style.setProperty('--primary', colors.primary.replace('hsl(', '').replace(')', ''));
      document.documentElement.style.setProperty('--accent', colors.accent.replace('hsl(', '').replace(')', ''));
      
      onThemeSettingsChange({
        ...themeSettings,
        colorScheme: scheme
      });

      toast({
        title: "تم تطبيق اللون",
        description: `تم تطبيق نظام الألوان ${colors.name}`
      });
    }
  };

  const applyFontSize = (size: string) => {
    const fontSize = fontSizes[size as keyof typeof fontSizes];
    if (fontSize) {
      document.documentElement.style.fontSize = fontSize.value;
      
      onThemeSettingsChange({
        ...themeSettings,
        fontSize: size
      });

      toast({
        title: "تم تطبيق الخط",
        description: `تم تطبيق حجم الخط ${fontSize.name}`
      });
    }
  };

  const applyBorderRadius = (radius: string) => {
    const borderRadius = borderRadiuses[radius as keyof typeof borderRadiuses];
    if (borderRadius) {
      document.documentElement.style.setProperty('--radius', borderRadius.value);
      
      onThemeSettingsChange({
        ...themeSettings,
        borderRadius: radius
      });

      toast({
        title: "تم تطبيق الحواف",
        description: `تم تطبيق انحناء الحواف ${borderRadius.name}`
      });
    }
  };

  const toggleTheme = (mode: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (mode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(mode);
    }

    onThemeSettingsChange({
      ...themeSettings,
      mode
    });

    localStorage.setItem('theme', mode);

    toast({
      title: "تم تغيير المظهر",
      description: `تم تطبيق المظهر ${mode === 'light' ? 'الفاتح' : mode === 'dark' ? 'الداكن' : 'النظام'}`
    });
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      mode: 'dark' as const,
      colorScheme: 'blue' as const,
      fontSize: 'medium' as const,
      borderRadius: 'medium' as const
    };

    // إعادة تعيين CSS
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add('dark');
    document.documentElement.style.fontSize = '16px';
    document.documentElement.style.setProperty('--radius', '8px');
    document.documentElement.style.setProperty('--primary', '217 91% 60%');
    document.documentElement.style.setProperty('--accent', '142 76% 36%');

    onThemeSettingsChange(defaultSettings);

    toast({
      title: "تم إعادة التعيين",
      description: "تم إعادة تعيين إعدادات المظهر إلى الافتراضية"
    });
  };

  return (
    <div className="space-y-6">
      {/* Theme Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            وضع المظهر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={themeSettings.mode === 'light' ? 'default' : 'outline'}
              onClick={() => toggleTheme('light')}
              className="flex flex-col items-center gap-2 h-auto py-3"
            >
              <Sun className="w-5 h-5" />
              فاتح
            </Button>
            <Button
              variant={themeSettings.mode === 'dark' ? 'default' : 'outline'}
              onClick={() => toggleTheme('dark')}
              className="flex flex-col items-center gap-2 h-auto py-3"
            >
              <Moon className="w-5 h-5" />
              داكن
            </Button>
            <Button
              variant={themeSettings.mode === 'system' ? 'default' : 'outline'}
              onClick={() => toggleTheme('system')}
              className="flex flex-col items-center gap-2 h-auto py-3"
            >
              <Monitor className="w-5 h-5" />
              النظام
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            نظام الألوان
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(colorSchemes).map(([key, scheme]) => (
              <Button
                key={key}
                variant={themeSettings.colorScheme === key ? 'default' : 'outline'}
                onClick={() => applyColorScheme(key)}
                className="flex items-center gap-2 h-auto py-3"
              >
                <div className="flex gap-1">
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: scheme.primary }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: scheme.accent }}
                  />
                </div>
                {scheme.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Font Size */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brush className="w-5 h-5" />
            حجم الخط
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={themeSettings.fontSize}
            onValueChange={applyFontSize}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(fontSizes).map(([key, size]) => (
                <SelectItem key={key} value={key}>
                  {size.name} ({size.value})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Border Radius */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brush className="w-5 h-5" />
            انحناء الحواف
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={themeSettings.borderRadius}
            onValueChange={applyBorderRadius}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(borderRadiuses).map(([key, radius]) => (
                <SelectItem key={key} value={key}>
                  {radius.name} ({radius.value})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <Card>
        <CardContent className="pt-6">
          <Button onClick={resetToDefaults} variant="outline" className="w-full">
            إعادة تعيين إلى الإعدادات الافتراضية
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};