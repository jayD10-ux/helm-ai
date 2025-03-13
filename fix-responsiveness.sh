#!/bin/bash

# Fix responsiveness issues in the chat interface
cat > src/components/chat/ChatInterface.tsx << 'EOL'
import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useMCPServers } from "@/hooks/use-mcp-servers";
import { supabase } from "@/lib/supabase";
import { fetchMCPCapabilities } from "@/services/composio";
import { ChatList } from "./ChatList";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";
import { ChatFooter } from "./ChatFooter";
import { ChatHistory } from "./ChatHistory";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface WidgetData {
  name: string;
  description: string;
  type: string;
  config: Record<string, any>;
}

interface MCPData {
  serverId: string;
  serverName: string;
  capabilities: any[];
  data?: any;
}

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

const ChatInterface = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { mcpServers } = useMCPServers();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm Helm AI, your assistant for working with AI models and MCPs (Model Context Protocols). How can I help you today?",
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Load chat history from Supabase
  useEffect(() => {
    const loadInitialChat = async () => {
      try {
        // Get all chats for history
        const { data: allChats, error: historyError } = await supabase
          .from('chats')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (historyError) throw historyError;
        
        if (allChats) {
          setChatHistory(allChats);
        }
        
        // Get the most recent chat
        const { data: chats, error: chatError } = await supabase
          .from('chats')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (chatError) throw chatError;
        
        // If there's an existing chat, load its messages
        if (chats && chats.length > 0) {
          const recentChatId = chats[0].id;
          setChatId(recentChatId);
          
          const { data: messageData, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', recentChatId)
            .order('timestamp', { ascending: true });
            
          if (messagesError) throw messagesError;
          
          if (messageData && messageData.length > 0) {
            setMessages(messageData.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })));
          }
        } else {
          // Create a new chat
          createNewChat();
        }
      } catch (error) {
        console.error('Error loading chat:', error);
        toast({
          title: "Error loading chat history",
          description: "Failed to load your previous conversations.",
          variant: "destructive"
        });
      }
    };
    
    loadInitialChat();
  }, []);
  
  const createNewChat = async () => {
    try {
      setLoading(true);
      // Create a new chat in the database
      const { data, error } = await supabase
        .from('chats')
        .insert([{ title: 'New Conversation' }])
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setChatId(data[0].id);
        
        // Add welcome message to the new chat
        const welcomeMessage = {
          id: "1",
          content: "Hello! I'm Helm AI, your assistant for working with AI models and MCPs (Model Context Protocols). How can I help you today?",
          sender: "ai" as const,
          timestamp: new Date(),
          chat_id: data[0].id
        };
        
        await supabase
          .from('messages')
          .insert([welcomeMessage]);
          
        setMessages([{
          id: "1",
          content: welcomeMessage.content,
          sender: welcomeMessage.sender,
          timestamp: welcomeMessage.timestamp
        }]);
        
        // Update chat history
        setChatHistory(prev => [data[0], ...prev]);
        
        toast({
          title: "New chat created",
          description: "Started a fresh conversation with Helm AI."
        });
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast({
        title: "Error creating new chat",
        description: "Failed to start a new conversation.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async (selectedChatId: string) => {
    try {
      setLoading(true);
      setChatId(selectedChatId);
      
      const { data: messageData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', selectedChatId)
        .order('timestamp', { ascending: true });
        
      if (messagesError) throw messagesError;
      
      if (messageData && messageData.length > 0) {
        setMessages(messageData.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } else {
        setMessages([]);
      }
      
      // Close history sidebar
      setHistoryOpen(false);
    } catch (error) {
      console.error('Error loading chat:', error);
      toast({
        title: "Error loading chat",
        description: "Failed to load the selected conversation.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveWidgetToDatabase = async (widgetData: WidgetData) => {
    try {
      const { data, error } = await supabase
        .from('widgets')
        .insert([widgetData])
        .select();

      if (error) {
        throw error;
      }

      return data[0].id;
    } catch (error) {
      console.error('Error saving widget:', error);
      throw error;
    }
  };
  
  const checkForMCPRelevance = async (userMessage: string) => {
    const mcpKeywords = [
      'google sheet', 'spreadsheet', 'document', 'file', 
      'database', 'api', 'data', 'retrieve', 'get', 'fetch',
      'connected', 'mcp', 'model context protocol'
    ];
    
    const lowerMessage = userMessage.toLowerCase();
    const isMCPRelevant = mcpKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (!isMCPRelevant || mcpServers.length === 0) {
      return null;
    }
    
    const mcpData: MCPData[] = [];
    
    for (const server of mcpServers) {
      if (server.status === "connected") {
        try {
          console.log(`Fetching capabilities for MCP server: ${server.name}`);
          const capabilities = await fetchMCPCapabilities(server);
          
          mcpData.push({
            serverId: server.id,
            serverName: server.name,
            capabilities: capabilities
          });
        } catch (error) {
          console.error(`Error fetching capabilities for ${server.name}:`, error);
        }
      }
    }
    
    return mcpData.length > 0 ? mcpData : null;
  };
  
  const handleSendMessage = async (input: string) => {
    if (input.trim() === "" || !chatId) return;
    
    try {
      setLoading(true);
      const userMessage: Message = {
        id: Date.now().toString(),
        content: input,
        sender: "user",
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, userMessage]);
      
      await supabase
        .from('messages')
        .insert([{
          content: userMessage.content,
          sender: userMessage.sender,
          chat_id: chatId,
          timestamp: userMessage.timestamp
        }]);
      
      const mcpData = await checkForMCPRelevance(userMessage.content);
      console.log("MCP data for request:", mcpData);
      
      const response = await supabase.functions.invoke('llm-chat', {
        body: { 
          message: userMessage.content, 
          chatId,
          mcpData: mcpData
        },
      });
      
      console.log('LLM response:', response.data);
      
      if (response.data && response.data.type === "widget_creation") {
        const widgetId = await saveWidgetToDatabase(response.data.widget);
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `${response.data.message} You can view it in the Widgets page or [click here](#) to see it now.`,
          sender: "ai",
          timestamp: new Date()
        };
        
        setMessages((prev) => [...prev, aiMessage]);
        
        await supabase
          .from('messages')
          .insert([{
            content: aiMessage.content,
            sender: aiMessage.sender,
            chat_id: chatId,
            timestamp: aiMessage.timestamp
          }]);
          
        toast({
          title: "Widget Created!",
          description: `"${response.data.widget.name}" has been added to your widgets.`,
          action: (
            <div 
              className="cursor-pointer px-2 py-1 text-xs rounded-md bg-neutral-800 hover:bg-neutral-700"
              onClick={() => navigate('/widgets')}
            >
              View Widgets
            </div>
          )
        });
      } else {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.data?.message || "I'm processing your request. This is a placeholder response.",
          sender: "ai",
          timestamp: new Date()
        };
        
        setMessages((prev) => [...prev, aiMessage]);
        
        await supabase
          .from('messages')
          .insert([{
            content: aiMessage.content,
            sender: aiMessage.sender,
            chat_id: chatId,
            timestamp: aiMessage.timestamp
          }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Failed to send your message.",
        variant: "destructive"
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error while processing your message. Please try again later.",
        sender: "ai",
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      if (chatId) {
        await supabase
          .from('messages')
          .insert([{
            content: errorMessage.content,
            sender: errorMessage.sender,
            chat_id: chatId,
            timestamp: errorMessage.timestamp
          }]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full relative">
      <ChatHeader 
        onNewChat={createNewChat} 
        isLoading={loading} 
        onHistoryClick={() => setHistoryOpen(true)}
      />
      
      <div className="flex-1 overflow-auto" style={{ paddingBottom: "120px" }}>
        <ChatList 
          messages={messages} 
          ref={messagesEndRef}
          isLoading={loading}
        />
        
        {loading && messages[messages.length - 1]?.sender === "user" && (
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground">
              <div className="text-sm font-semibold">AI</div>
            </div>
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-semibold">Helm AI</div>
              </div>
              <div className="prose prose-neutral dark:prose-invert">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "0ms" }}></div>
                    <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "300ms" }}></div>
                    <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "600ms" }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 right-0 bg-background pt-2 pb-4 z-10 w-[calc(100%-80px)]">
        <div className="max-w-[1200px] mx-auto px-4">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={loading}
            placeholder="Type your message..."
          />
          
          <ChatFooter isLoading={loading} />
        </div>
      </div>
      
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-[350px] sm:w-[450px]">
          <ChatHistory 
            chats={chatHistory} 
            onSelectChat={loadChat}
            currentChatId={chatId || ""}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ChatInterface;
EOL

# Update the CSS to fix responsiveness issues
cat > src/components/layout/Sidebar.tsx << 'EOL'
import { cn } from "@/lib/utils";
import { 
  Terminal, 
  MessageSquare, 
  Component, 
  Settings,
  Network
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem = ({ icon: Icon, label, path, isActive, onClick }: NavItemProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "flex items-center justify-center w-full p-2 rounded-md transition-colors",
            isActive
              ? "bg-secondary/50 text-secondary-foreground"
              : "text-muted-foreground hover:bg-secondary/20 hover:text-secondary-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Terminal, label: "Chat", path: "/" },
    { icon: Component, label: "Widgets", path: "/widgets" },
    { icon: MessageSquare, label: "MCPs", path: "/mcps" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <TooltipProvider>
      <div
        className="fixed top-0 left-0 bottom-0 w-[80px] bg-background border-r border-neutral-800 flex flex-col z-20"
      >
        <div className="flex flex-col items-center justify-center h-16 border-b border-neutral-800">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-primary-foreground">
            <Network className="h-5 w-5" />
          </div>
        </div>

        <div className="flex-1 py-4">
          <nav className="grid gap-4 px-2">
            {navItems.map((item) => (
              <NavItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
                isActive={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              />
            ))}
          </nav>
        </div>
        
        <div className="p-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">AI</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-sm font-medium">User Account</p>
              <p className="text-xs text-muted-foreground">Free Plan</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Sidebar;
EOL

echo "Fixed responsiveness issues in the chat interface!"
