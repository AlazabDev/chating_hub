import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AdvancedCodeEditor } from "@/components/CodeEditor/AdvancedCodeEditor";
import EnhancedAIPlatform from "@/components/AI/EnhancedAIPlatform";
import ProductionDashboard from "@/components/Production/ProductionDashboard";
import SystemSettings from "@/components/Settings/SystemSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/Chat/ChatSidebar";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useAIConversation } from "@/hooks/useAIConversation";
import { useNavigate } from "react-router-dom";
import { 
  Code, 
  Bot, 
  Cloud, 
  Settings, 
  LogIn,
  Github,
  MessageSquare,
  Menu
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

  // Temporarily disable auth check for development
  // useEffect(() => {
  //   if (!loading && !user) {
  //     navigate('/auth');
  //   }
  // }, [user, loading, navigate]);

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
    <SidebarProvider>
      <div className="min-h-screen bg-background w-full flex">
        {/* Sidebar - Only show on AI tab */}
        {activeTab === "ai" && (
          <ChatSidebar 
            conversations={[]}
            currentConversationId={currentConversationId}
            onSelectConversation={loadConversation}
            onNewConversation={startNewConversation}
            onClearConversation={clearConversation}
            isLoading={aiLoading}
          />
        )}
        
        <div className="flex-1 flex flex-col">
          {/* Header with Sidebar Trigger */}
          <div className="header-glass border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeTab === "ai" && (
                <SidebarTrigger className="hover:bg-muted p-2 rounded-md transition-colors" />
              )}
              <h1 className="text-xl font-bold">منصة التطوير المتقدمة</h1>
            </div>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="hover-lift"
            >
              تسجيل الخروج
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b p-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="ai" className="tab-enhanced">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  مساعد التطوير
                </TabsTrigger>
                <TabsTrigger value="code" className="tab-enhanced">
                  <Code className="w-4 h-4 mr-2" />
                  محرر الكود
                </TabsTrigger>
                <TabsTrigger value="production" className="tab-enhanced">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </TabsTrigger>
                <TabsTrigger value="settings" className="tab-enhanced">
                  <Settings className="w-4 h-4 mr-2" />
                  الإعدادات
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <TabsContent value="ai" className="flex-1 m-0 flex">
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
              </TabsContent>

              <TabsContent value="code" className="flex-1 m-0">
                <AdvancedCodeEditor />
              </TabsContent>

              <TabsContent value="production" className="flex-1 m-0">
                <ProductionDashboard />
              </TabsContent>

              <TabsContent value="settings" className="flex-1 m-0">
                <SystemSettings />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;