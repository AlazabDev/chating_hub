import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AdvancedCodeEditor } from "@/components/CodeEditor/AdvancedCodeEditor";
import EnhancedAIPlatform from "@/components/AI/EnhancedAIPlatform";
import ProductionDashboard from "@/components/Production/ProductionDashboard";
import SystemSettings from "@/components/Settings/SystemSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useAIConversation } from "@/hooks/useAIConversation";
import ConversationHistory from "@/components/AI/ConversationHistory";
import { useNavigate } from "react-router-dom";
import { 
  Code, 
  Bot, 
  Cloud, 
  Settings, 
  LogIn,
  Github,
  MessageSquare
} from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("ai");
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { 
    messages, 
    loading: aiLoading, 
    sendMessage, 
    clearConversation, 
    startNewConversation,
    loadConversation,
    currentConversationId 
  } = useAIConversation();

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
                <TabsTrigger value="ai"><MessageSquare className="w-4 h-4 mr-2" />مساعد التطوير</TabsTrigger>
                <TabsTrigger value="code"><Code className="w-4 h-4 mr-2" />محرر الكود</TabsTrigger>
                <TabsTrigger value="production"><Github className="w-4 h-4 mr-2" />GitHub</TabsTrigger>
                <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />الإعدادات</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="ai" className="flex-1 p-0">
              <div className="flex h-full">
                <div className="w-80 border-r bg-sidebar/30 p-4">
                  <ConversationHistory 
                    onSelectConversation={loadConversation}
                    currentConversationId={currentConversationId}
                  />
                </div>
                <div className="flex-1">
                  <EnhancedAIPlatform 
                    onSendMessage={async (content: string, model: "deepseek" | "azure-openai" | "claude") => {
                      await sendMessage(content, model);
                    }}
                    messages={messages}
                    isLoading={aiLoading}
                    modelStatus={{ deepseek: true, azureOpenAI: true, claude: true }}
                    onClearConversation={clearConversation}
                    onNewConversation={startNewConversation}
                  />
                </div>
              </div>
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