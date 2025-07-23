import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface DeploymentStatusProps {
  isReady: boolean;
  errors: string[];
  warnings: string[];
  lastChecked?: Date;
}

export const DeploymentStatus: React.FC<DeploymentStatusProps> = ({
  isReady,
  errors,
  warnings,
  lastChecked
}) => {
  const getStatusIcon = () => {
    if (errors.length > 0) {
      return <XCircle className="w-5 h-5 text-destructive" />;
    }
    if (warnings.length > 0) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
    if (isReady) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <Clock className="w-5 h-5 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (errors.length > 0) return 'غير جاهز للنشر';
    if (warnings.length > 0) return 'جاهز مع تحذيرات';
    if (isReady) return 'جاهز للنشر';
    return 'قيد التحقق';
  };

  const getStatusClass = () => {
    if (errors.length > 0) return 'deployment-status error';
    if (warnings.length > 0) return 'deployment-status pending';
    if (isReady) return 'deployment-status ready';
    return 'deployment-status pending';
  };

  return (
    <Card className="production-ready">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>حالة النشر</span>
          <div className={getStatusClass()}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Errors */}
        {errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-destructive flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              أخطاء يجب إصلاحها ({errors.length})
            </h4>
            <div className="space-y-1">
              {errors.map((error, index) => (
                <Badge key={index} variant="destructive" className="block w-fit">
                  {error}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              تحذيرات ({warnings.length})
            </h4>
            <div className="space-y-1">
              {warnings.map((warning, index) => (
                <Badge key={index} variant="secondary" className="block w-fit bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                  {warning}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Success */}
        {isReady && errors.length === 0 && warnings.length === 0 && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">التطبيق جاهز للنشر بأمان</span>
          </div>
        )}

        {/* Last checked */}
        {lastChecked && (
          <div className="text-sm text-muted-foreground border-t pt-3">
            آخر فحص: {lastChecked.toLocaleString('ar-SA')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};