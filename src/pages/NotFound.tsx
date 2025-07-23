import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-8">
          <AlertTriangle className="w-24 h-24 text-destructive mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">الصفحة غير موجودة</h2>
          <p className="text-muted-foreground mb-6">
            عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم نقلها إلى مكان آخر.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            asChild 
            className="w-full bg-gradient-primary hover:opacity-90 shadow-ai"
          >
            <a href="/" className="flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              العودة للصفحة الرئيسية
              <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
          
          <p className="text-xs text-muted-foreground">
            المسار المطلوب: <code className="bg-muted px-2 py-1 rounded text-xs">{location.pathname}</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
