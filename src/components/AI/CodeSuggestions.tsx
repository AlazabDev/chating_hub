import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { 
  Lightbulb, 
  Bug, 
  Zap, 
  Shield, 
  Check, 
  X, 
  Code2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CodeSuggestion {
  id: string;
  repository_id: string;
  file_path: string;
  suggestion_type: 'improvement' | 'bug_fix' | 'optimization' | 'security';
  title: string;
  description: string;
  code_snippet?: string;
  suggested_fix?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'applied' | 'dismissed';
  created_by_ai: boolean;
  created_at: string;
}

interface CodeSuggestionsProps {
  repositoryId?: string;
}

const CodeSuggestions: React.FC<CodeSuggestionsProps> = ({ repositoryId }) => {
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSuggestions();
  }, [repositoryId]);

  const loadSuggestions = async () => {
    try {
      let query = supabase
        .from('code_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (repositoryId) {
        query = query.eq('repository_id', repositoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSuggestions((data || []) as CodeSuggestion[]);
    } catch (error) {
      console.error('خطأ في تحميل الاقتراحات:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل اقتراحات الكود",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSuggestionStatus = async (suggestionId: string, status: 'applied' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('code_suggestions')
        .update({ status })
        .eq('id', suggestionId);

      if (error) throw error;

      setSuggestions(prev => 
        prev.map(s => s.id === suggestionId ? { ...s, status } : s)
      );

      toast({
        title: status === 'applied' ? "تم التطبيق" : "تم الرفض",
        description: status === 'applied' 
          ? "تم تطبيق الاقتراح بنجاح"
          : "تم رفض الاقتراح",
      });
    } catch (error) {
      console.error('خطأ في تحديث حالة الاقتراح:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الاقتراح",
        variant: "destructive",
      });
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'bug_fix':
        return <Bug className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'optimization':
        return <Zap className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const processedSuggestions = suggestions.filter(s => s.status !== 'pending');

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            اقتراحات الكود
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          اقتراحات الكود
          <Badge variant="secondary">{suggestions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد اقتراحات للكود</p>
              <p className="text-sm">سيقوم الذكاء الاصطناعي بإنشاء اقتراحات تلقائياً</p>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {/* الاقتراحات المعلقة */}
              {pendingSuggestions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    اقتراحات معلقة ({pendingSuggestions.length})
                  </h4>
                  <div className="space-y-3">
                    {pendingSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="text-primary">
                              {getSuggestionIcon(suggestion.suggestion_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium">{suggestion.title}</h5>
                              <p className="text-sm text-muted-foreground mt-1">
                                {suggestion.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={getPriorityColor(suggestion.priority) as any}>
                                  {suggestion.priority}
                                </Badge>
                                <Badge variant="outline">
                                  {suggestion.suggestion_type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {suggestion.file_path}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {suggestion.code_snippet && (
                          <div className="bg-muted p-3 rounded text-sm">
                            <p className="text-xs text-muted-foreground mb-2">الكود الحالي:</p>
                            <code className="whitespace-pre-wrap">
                              {suggestion.code_snippet}
                            </code>
                          </div>
                        )}

                        {suggestion.suggested_fix && (
                          <div className="bg-green-50 p-3 rounded text-sm">
                            <p className="text-xs text-green-700 mb-2">الإصلاح المقترح:</p>
                            <code className="whitespace-pre-wrap text-green-800">
                              {suggestion.suggested_fix}
                            </code>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => updateSuggestionStatus(suggestion.id, 'applied')}
                            className="flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" />
                            تطبيق
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateSuggestionStatus(suggestion.id, 'dismissed')}
                            className="flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
                            رفض
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* الاقتراحات المعالجة */}
              {processedSuggestions.length > 0 && (
                <div>
                  {pendingSuggestions.length > 0 && <Separator className="my-4" />}
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    اقتراحات سابقة ({processedSuggestions.length})
                  </h4>
                  <div className="space-y-2">
                    {processedSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            {getSuggestionIcon(suggestion.suggestion_type)}
                            <span className="font-medium text-sm">{suggestion.title}</span>
                          </div>
                          <Badge className={getStatusColor(suggestion.status)}>
                            {suggestion.status === 'applied' ? 'مطبق' : 'مرفوض'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CodeSuggestions;