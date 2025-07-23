import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Languages, Globe, Type, AlignLeft, AlignRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LanguageSettingsProps {
  languageSettings: {
    language: 'ar' | 'en' | 'fr' | 'es';
    direction: 'rtl' | 'ltr';
    dateFormat: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
    timeFormat: '12h' | '24h';
    autoDetect: boolean;
  };
  onLanguageSettingsChange: (settings: any) => void;
}

const languages = {
  ar: { name: 'العربية', nativeName: 'العربية', direction: 'rtl' },
  en: { name: 'الإنجليزية', nativeName: 'English', direction: 'ltr' },
  fr: { name: 'الفرنسية', nativeName: 'Français', direction: 'ltr' },
  es: { name: 'الإسبانية', nativeName: 'Español', direction: 'ltr' }
};

const dateFormats = {
  'dd/mm/yyyy': { name: 'يوم/شهر/سنة', example: '23/07/2025' },
  'mm/dd/yyyy': { name: 'شهر/يوم/سنة', example: '07/23/2025' },
  'yyyy-mm-dd': { name: 'سنة-شهر-يوم', example: '2025-07-23' }
};

const timeFormats = {
  '12h': { name: '12 ساعة', example: '2:30 PM' },
  '24h': { name: '24 ساعة', example: '14:30' }
};

export const LanguageSettings: React.FC<LanguageSettingsProps> = ({
  languageSettings,
  onLanguageSettingsChange
}) => {
  const { toast } = useToast();

  const changeLanguage = (language: string) => {
    const selectedLang = languages[language as keyof typeof languages];
    if (selectedLang) {
      const newSettings = {
        ...languageSettings,
        language: language as 'ar' | 'en' | 'fr' | 'es',
        direction: selectedLang.direction as 'rtl' | 'ltr'
      };

      // تطبيق اتجاه النص
      document.documentElement.dir = selectedLang.direction;
      document.documentElement.lang = language;

      onLanguageSettingsChange(newSettings);

      toast({
        title: "تم تغيير اللغة",
        description: `تم تطبيق اللغة ${selectedLang.name}`
      });
    }
  };

  const changeDateFormat = (format: string) => {
    onLanguageSettingsChange({
      ...languageSettings,
      dateFormat: format
    });

    toast({
      title: "تم تغيير تنسيق التاريخ",
      description: `تم تطبيق تنسيق ${dateFormats[format as keyof typeof dateFormats].name}`
    });
  };

  const changeTimeFormat = (format: string) => {
    onLanguageSettingsChange({
      ...languageSettings,
      timeFormat: format
    });

    toast({
      title: "تم تغيير تنسيق الوقت",
      description: `تم تطبيق تنسيق ${timeFormats[format as keyof typeof timeFormats].name}`
    });
  };

  const toggleAutoDetect = (autoDetect: boolean) => {
    onLanguageSettingsChange({
      ...languageSettings,
      autoDetect
    });

    if (autoDetect) {
      // كشف اللغة التلقائي
      const browserLang = navigator.language.split('-')[0];
      if (browserLang in languages) {
        changeLanguage(browserLang);
      }
    }

    toast({
      title: autoDetect ? "تم تمكين الكشف التلقائي" : "تم إيقاف الكشف التلقائي",
      description: autoDetect ? "سيتم كشف اللغة تلقائياً من المتصفح" : "يجب اختيار اللغة يدوياً"
    });
  };

  const toggleDirection = () => {
    const newDirection = languageSettings.direction === 'rtl' ? 'ltr' : 'rtl';
    
    document.documentElement.dir = newDirection;
    
    onLanguageSettingsChange({
      ...languageSettings,
      direction: newDirection
    });

    toast({
      title: "تم تغيير الاتجاه",
      description: `تم تطبيق اتجاه ${newDirection === 'rtl' ? 'من اليمين إلى اليسار' : 'من اليسار إلى اليمين'}`
    });
  };

  return (
    <div className="space-y-6">
      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            اختيار اللغة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="language-select">اللغة الأساسية</Label>
            <Select
              value={languageSettings.language}
              onValueChange={changeLanguage}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(languages).map(([key, lang]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{lang.name}</span>
                      <span className="text-muted-foreground">({lang.nativeName})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-detect">كشف اللغة تلقائياً</Label>
            <Switch
              id="auto-detect"
              checked={languageSettings.autoDetect}
              onCheckedChange={toggleAutoDetect}
            />
          </div>
        </CardContent>
      </Card>

      {/* Text Direction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            اتجاه النص
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={languageSettings.direction === 'rtl' ? 'default' : 'outline'}
              onClick={() => languageSettings.direction !== 'rtl' && toggleDirection()}
              className="flex items-center gap-2"
            >
              <AlignRight className="w-4 h-4" />
              من اليمين لليسار
            </Button>
            <Button
              variant={languageSettings.direction === 'ltr' ? 'default' : 'outline'}
              onClick={() => languageSettings.direction !== 'ltr' && toggleDirection()}
              className="flex items-center gap-2"
            >
              <AlignLeft className="w-4 h-4" />
              من اليسار لليمين
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Date & Time Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            تنسيق التاريخ والوقت
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="date-format">تنسيق التاريخ</Label>
            <Select
              value={languageSettings.dateFormat}
              onValueChange={changeDateFormat}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(dateFormats).map(([key, format]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{format.name}</span>
                      <span className="text-muted-foreground">({format.example})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="time-format">تنسيق الوقت</Label>
            <Select
              value={languageSettings.timeFormat}
              onValueChange={changeTimeFormat}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(timeFormats).map(([key, format]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{format.name}</span>
                      <span className="text-muted-foreground">({format.example})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};