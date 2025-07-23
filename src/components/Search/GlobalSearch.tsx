import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  File, 
  MessageSquare, 
  Database, 
  GitBranch,
  Code,
  User,
  Clock,
  Filter,
  X,
  ArrowRight,
  Hash
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'conversation' | 'repository' | 'file' | 'user' | 'code_suggestion' | 'analysis';
  title: string;
  content: string;
  highlight?: string;
  metadata?: {
    date?: string;
    author?: string;
    path?: string;
    tags?: string[];
  };
  relevance: number;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onResultSelect?: (result: SearchResult) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onResultSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filters, setFilters] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const searchTypes = [
    { key: 'conversation', label: 'المحادثات', icon: MessageSquare },
    { key: 'repository', label: 'المستودعات', icon: GitBranch },
    { key: 'file', label: 'الملفات', icon: File },
    { key: 'code_suggestion', label: 'اقتراحات الكود', icon: Code },
    { key: 'analysis', label: 'التحاليل', icon: Database },
    { key: 'user', label: 'المستخدمين', icon: User }
  ];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Load recent searches
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      const debounceTimeout = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(debounceTimeout);
    } else {
      setResults([]);
    }
  }, [query, filters]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search conversations
      if (filters.length === 0 || filters.includes('conversation')) {
        const { data: conversations } = await supabase
          .from('ai_conversations')
          .select(`
            id,
            title,
            created_at,
            ai_messages (
              content
            )
          `)
          .ilike('title', `%${query}%`)
          .limit(5);

        conversations?.forEach(conv => {
          searchResults.push({
            id: conv.id,
            type: 'conversation',
            title: conv.title,
            content: conv.ai_messages?.[0]?.content?.slice(0, 100) + '...' || '',
            metadata: {
              date: conv.created_at,
              tags: ['محادثة']
            },
            relevance: calculateRelevance(conv.title, query)
          });
        });
      }

      // Search repositories
      if (filters.length === 0 || filters.includes('repository')) {
        const { data: repositories } = await supabase
          .from('repositories')
          .select('*')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5);

        repositories?.forEach(repo => {
          searchResults.push({
            id: repo.id,
            type: 'repository',
            title: repo.name,
            content: repo.description || '',
            metadata: {
              date: repo.created_at,
              tags: [repo.frappe_type, repo.status]
            },
            relevance: calculateRelevance(repo.name + ' ' + repo.description, query)
          });
        });
      }

      // Search code suggestions
      if (filters.length === 0 || filters.includes('code_suggestion')) {
        const { data: suggestions } = await supabase
          .from('code_suggestions')
          .select('*')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5);

        suggestions?.forEach(suggestion => {
          searchResults.push({
            id: suggestion.id,
            type: 'code_suggestion',
            title: suggestion.title,
            content: suggestion.description,
            metadata: {
              date: suggestion.created_at,
              path: suggestion.file_path,
              tags: [suggestion.suggestion_type, suggestion.priority]
            },
            relevance: calculateRelevance(suggestion.title + ' ' + suggestion.description, query)
          });
        });
      }

      // Search code analysis
      if (filters.length === 0 || filters.includes('analysis')) {
        const { data: analyses } = await supabase
          .from('code_analysis')
          .select(`
            id,
            analysis_type,
            results,
            started_at,
            status,
            repositories (name)
          `)
          .limit(5);

        analyses?.forEach(analysis => {
          const resultsText = JSON.stringify(analysis.results).toLowerCase();
          if (resultsText.includes(query.toLowerCase())) {
            searchResults.push({
              id: analysis.id,
              type: 'analysis',
              title: `تحليل ${analysis.analysis_type}`,
              content: `تحليل للمستودع ${analysis.repositories?.name}`,
              metadata: {
                date: analysis.started_at,
                tags: [analysis.analysis_type, analysis.status]
              },
              relevance: calculateRelevance(resultsText, query)
            });
          }
        });
      }

      // Sort by relevance
      searchResults.sort((a, b) => b.relevance - a.relevance);
      setResults(searchResults.slice(0, 20));

      // Save to recent searches
      saveRecentSearch(query);

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "خطأ في البحث",
        description: "فشل في تنفيذ البحث",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateRelevance = (text: string, query: string): number => {
    if (!text) return 0;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Exact match gets highest score
    if (textLower.includes(queryLower)) {
      const exactPosition = textLower.indexOf(queryLower);
      // Earlier position in text gets higher score
      return 100 - exactPosition;
    }
    
    // Partial word matches
    const queryWords = queryLower.split(' ');
    let score = 0;
    queryWords.forEach(word => {
      if (textLower.includes(word)) {
        score += 10;
      }
    });
    
    return score;
  };

  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  const toggleFilter = (filterType: string) => {
    setFilters(prev => 
      prev.includes(filterType) 
        ? prev.filter(f => f !== filterType)
        : [...prev, filterType]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    onResultSelect?.(result);
    onClose();
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = searchTypes.find(t => t.key === type);
    return typeConfig ? typeConfig.icon : File;
  };

  const getTypeLabel = (type: string) => {
    const typeConfig = searchTypes.find(t => t.key === type);
    return typeConfig ? typeConfig.label : type;
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-primary/20 text-primary font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
      <Card className="w-full max-w-3xl glass-card animate-scale-in">
        <CardContent className="p-0">
          {/* Search Header */}
          <div className="p-4 border-b border-border/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ابحث في المحادثات، المستودعات، الملفات..."
                className="pl-10 pr-10 text-lg h-12 border-0 focus-visible:ring-0"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Filter className="w-3 h-3" />
                <span>تصفية:</span>
              </div>
              {searchTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.key}
                    variant={filters.includes(type.key) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFilter(type.key)}
                    className="h-7 text-xs"
                  >
                    <Icon className="w-3 h-3 ml-1" />
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Search Results */}
          <ScrollArea className="max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  جاري البحث...
                </div>
              </div>
            ) : query.length <= 2 ? (
              <div className="p-4">
                {recentSearches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      عمليات بحث حديثة
                    </h3>
                    <div className="space-y-2">
                      {recentSearches.map((search, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          onClick={() => setQuery(search)}
                          className="w-full justify-start text-sm h-auto p-2"
                        >
                          <Search className="w-3 h-3 ml-2 text-muted-foreground" />
                          {search}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">نصائح البحث</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• استخدم كلمات مفتاحية واضحة</p>
                    <p>• جرب البحث بأسماء الملفات أو المشاريع</p>
                    <p>• استخدم الفلاتر لتضييق النتائج</p>
                  </div>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">لا توجد نتائج</p>
                <p className="text-sm">جرب استخدام كلمات مفتاحية مختلفة</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {results.map((result, index) => {
                  const Icon = getTypeIcon(result.type);
                  return (
                    <div
                      key={result.id}
                      onClick={() => handleResultSelect(result)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 group ${
                        index === selectedIndex 
                          ? 'bg-primary/10 border-primary/30 shadow-ai' 
                          : 'hover:bg-muted/30 hover:border-border'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm mb-1">
                                {highlightText(result.title, query)}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {highlightText(result.content, query)}
                              </p>
                            </div>
                            
                            <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              {getTypeLabel(result.type)}
                            </Badge>
                            
                            {result.metadata?.tags?.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="text-xs px-2 py-0">
                                {tag}
                              </Badge>
                            ))}
                            
                            {result.metadata?.date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                                <Clock className="w-3 h-3" />
                                {new Date(result.metadata.date).toLocaleDateString('ar-SA')}
                              </div>
                            )}
                          </div>
                          
                          {result.metadata?.path && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Hash className="w-3 h-3" />
                              {result.metadata.path}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {query.length > 2 && (
            <div className="p-3 border-t border-border/30 bg-muted/20">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {results.length > 0 ? `${results.length} نتيجة` : 'لا توجد نتائج'}
                </span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-border rounded text-xs">↑↓</span>
                    للتنقل
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-border rounded text-xs">Enter</span>
                    للفتح
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-border rounded text-xs">Esc</span>
                    للإغلاق
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalSearch;