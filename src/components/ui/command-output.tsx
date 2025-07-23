import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy, Check, Terminal, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

interface CommandResult {
  command: string;
  output: string;
  error?: string;
  exitCode: number;
  timestamp: Date;
  executionTime: number;
}

interface CommandOutputProps {
  results: CommandResult[];
  onCopyOutput: (output: string) => void;
}

export const CommandOutput: React.FC<CommandOutputProps> = ({ results, onCopyOutput }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (output: string, index: number) => {
    onCopyOutput(output);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getStatusIcon = (exitCode: number) => {
    if (exitCode === 0) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadge = (exitCode: number) => {
    if (exitCode === 0) {
      return <Badge variant="default" className="bg-green-600">نجح</Badge>;
    }
    return <Badge variant="destructive">فشل</Badge>;
  };

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <Card key={index} className="p-4 bg-gradient-code border-code-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {result.command}
              </code>
              {getStatusIcon(result.exitCode)}
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(result.exitCode)}
              <span className="text-xs text-muted-foreground">
                {result.executionTime}ms
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(result.output, index)}
                className="h-8 w-8 p-0"
              >
                {copiedIndex === index ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <ScrollArea className="h-32">
            <pre className="text-sm text-foreground/90 whitespace-pre-wrap">
              {result.output}
            </pre>
            {result.error && (
              <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">خطأ:</span>
                </div>
                <pre className="text-sm text-destructive/90 whitespace-pre-wrap">
                  {result.error}
                </pre>
              </div>
            )}
          </ScrollArea>

          <div className="text-xs text-muted-foreground mt-2">
            تم التنفيذ في: {result.timestamp.toLocaleString('ar-EG')}
          </div>
        </Card>
      ))}
    </div>
  );
};