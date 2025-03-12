#!/bin/bash

# Update ChatHeader.tsx
cat > src/components/chat/ChatHeader.tsx << 'EOL'
import React from "react";
import { Plus, History } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatHeaderProps {
  onNewChat: () => void;
  onHistoryClick: () => void;
  isLoading: boolean;
}

export function ChatHeader({ onNewChat, onHistoryClick, isLoading }: ChatHeaderProps) {
  return (
    <div className="flex justify-end space-x-2 mb-4 pb-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
              onClick={onHistoryClick}
              disabled={isLoading}
            >
              <History className="h-4 w-4 text-neutral-200" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Chat History</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
              onClick={onNewChat}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 text-neutral-200" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>New Chat</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
EOL

# Update ChatFooter.tsx with improved loader
cat > src/components/chat/ChatFooter.tsx << 'EOL'
import React from "react";
import { useMCPServers } from "@/hooks/use-mcp-servers";

interface ChatFooterProps {
  isLoading: boolean;
}

export function ChatFooter({ isLoading }: ChatFooterProps) {
  const { mcpServers } = useMCPServers();
  
  return (
    <div className="mt-2 text-xs text-muted-foreground">
      {isLoading && (
        <div className="flex items-center space-x-2 mb-1">
          <div className="flex space-x-1">
            <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "0ms" }}></div>
            <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "300ms" }}></div>
            <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "600ms" }}></div>
          </div>
          <span>AI is thinking...</span>
        </div>
      )}
      {mcpServers.filter(s => s.status === "connected").length > 0 && (
        <p>
          {mcpServers.filter(s => s.status === "connected").length} MCP server(s) connected and available for queries.
        </p>
      )}
    </div>
  );
}
EOL

# Create ChatHistory.tsx
cat > src/components/chat/ChatHistory.tsx << 'EOL'
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

interface ChatHistoryProps {
  chats: Chat[];
  onSelectChat: (chatId: string) => void;
  currentChatId: string;
}

export function ChatHistory({ chats, onSelectChat, currentChatId }: ChatHistoryProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Chat History</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          {chats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No chat history found
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  chat.id === currentChatId
                    ? "bg-neutral-800"
                    : "hover:bg-neutral-900"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <p className="font-medium truncate">{chat.title}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
EOL

# Update ChatInterface.tsx
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
      
      <div className="flex-1 overflow-auto mb-[120px]">
        <ChatList 
          messages={messages} 
          ref={messagesEndRef}
          isLoading={loading}
        />
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-neutral-800 pt-2 pb-4 px-4">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={loading}
          placeholder="Type your message..."
        />
        
        <ChatFooter isLoading={loading} />
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

# Install date-fns if not already installed
npm install --save date-fns

echo "All chat interface components have been updated!"
