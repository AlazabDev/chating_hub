import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import ConversationHistory from "@/components/AI/ConversationHistory";
import { 
  MessageSquare, 
  History, 
  Plus,
  Trash2
} from "lucide-react";

interface ChatSidebarProps {
  conversations: any[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onClearConversation: () => void;
  isLoading: boolean;
}

export function ChatSidebar({ 
  conversations = [], 
  currentConversationId, 
  onSelectConversation,
  onNewConversation,
  onClearConversation,
  isLoading 
}: ChatSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-80"} collapsible="icon">
      <SidebarContent className="bg-card/50 backdrop-blur-lg border-r">
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            {!isCollapsed && (
              <>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  <span>المحادثات</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {conversations.length}
                </Badge>
              </>
            )}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {/* New Conversation Button */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onNewConversation}
                  className="w-full justify-start bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                >
                  <Plus className="w-4 h-4" />
                  {!isCollapsed && <span>محادثة جديدة</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Conversations List */}
              {!isCollapsed && (
                <div className="mt-4">
                  <ConversationHistory 
                    onSelectConversation={onSelectConversation}
                    currentConversationId={currentConversationId}
                  />
                </div>
              )}

              {/* Clear Conversation Button */}
              {currentConversationId && (
                <SidebarMenuItem className="mt-2">
                  <SidebarMenuButton
                    onClick={onClearConversation}
                    className="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-4 h-4" />
                    {!isCollapsed && <span>مسح المحادثة</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}