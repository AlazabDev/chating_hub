import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AdvancedCodeEditor } from "@/components/CodeEditor/AdvancedCodeEditor";
import EnhancedAIPlatform from "@/components/AI/EnhancedAIPlatform";
import ProductionDashboard from "@/components/Production/ProductionDashboard";
import { AppHeader } from "@/components/Header/AppHeader";
import { ProjectSidebar } from "@/components/Sidebar/ProjectSidebar";
import SystemSettings from "@/components/Settings/SystemSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { 
  Code, 
  Bot, 
  Cloud, 
  Settings, 
  Menu, 
  X,
  Sparkles,
  LogIn
} from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("ai");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">منصة التطوير المتقدمة</h1>
          <Button onClick={() => navigate('/auth')} size="lg">
            <LogIn className="w-5 h-5 mr-2" />
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b p-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="ai"><Bot className="w-4 h-4 mr-2" />الذكاء الاصطناعي</TabsTrigger>
                <TabsTrigger value="code"><Code className="w-4 h-4 mr-2" />محرر الكود</TabsTrigger>
                <TabsTrigger value="production"><Cloud className="w-4 h-4 mr-2" />الإنتاج</TabsTrigger>
                <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />الإعدادات</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="ai" className="flex-1">
              <EnhancedAIPlatform 
                onSendMessage={() => {}}
                messages={[]}
                isLoading={false}
                modelStatus={{ deepseek: true, openai: true, claude: true }}
              />
            </TabsContent>

            <TabsContent value="code" className="flex-1">
              <AdvancedCodeEditor />
            </TabsContent>

            <TabsContent value="production" className="flex-1">
              <ProductionDashboard />
            </TabsContent>

            <TabsContent value="settings" className="flex-1">
              <SystemSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;