#!/bin/bash

# Fix ChatFooter.tsx
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

# Fix ChatInput.tsx
cat > src/components/chat/ChatInput.tsx << 'EOL'
import React, { useState, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({ 
  onSendMessage, 
  isLoading, 
  placeholder = "Type your message..." 
}: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSendMessage = () => {
    if (input.trim() === "" || isLoading) return;
    onSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="relative">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[60px] w-full resize-none border border-neutral-800 bg-neutral-900 rounded-lg px-3 py-2 pr-12 focus-visible:ring-1 focus-visible:ring-neutral-400 focus-visible:outline-none"
        disabled={isLoading}
      />
      <button
        onClick={handleSendMessage}
        disabled={input.trim() === "" || isLoading}
        className="absolute bottom-2 right-2 p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:hover:bg-neutral-800 transition-colors"
      >
        <Send className="h-4 w-4 text-neutral-200" />
        <span className="sr-only">Send message</span>
      </button>
    </div>
  );
}
EOL

# Fix ChatList.tsx
cat > src/components/chat/ChatList.tsx << 'EOL'
import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { staggerContainer } from "@/components/ui/motion";
import { ChatMessage } from "./ChatMessage";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ChatListProps {
  messages: Message[];
  isLoading?: boolean;
}

export const ChatList = forwardRef<HTMLDivElement, ChatListProps>(
  ({ messages, isLoading }, ref) => {
    return (
      <div className="flex-1 overflow-y-auto px-4 scrollbar-none">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6 pb-6"
        >
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={ref} />
        </motion.div>
      </div>
    );
  }
);

ChatList.displayName = "ChatList";
EOL

# Fix ChatMessage.tsx
cat > src/components/chat/ChatMessage.tsx << 'EOL'
import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { slideIn } from "@/components/ui/motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Clock } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.sender === "user";
  
  return (
    <motion.div
      variants={slideIn}
      className="group relative flex items-start gap-3"
    >
      <div className="flex size-8 shrink-0 select-none items-center justify-center rounded-md bg-neutral-900 shadow">
        <Avatar className="h-8 w-8">
          <AvatarFallback className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
            isUser ? "bg-neutral-800 text-neutral-200" : "bg-neutral-800 text-neutral-200"
          )}>
            {isUser ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="font-semibold">{isUser ? "You" : "Helm AI"}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="prose prose-neutral dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 break-words text-sm">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </motion.div>
  );
}
EOL

# Fix ChatHeader.tsx
cat > src/components/chat/ChatHeader.tsx << 'EOL'
import React from "react";
import { Plus, History } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatHeaderProps {
  onNewChat: () => void;
  isLoading: boolean;
}

export function ChatHeader({ onNewChat, isLoading }: ChatHeaderProps) {
  return (
    <div className="flex justify-end space-x-2 mb-4 pb-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
              onClick={() => {}}
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

# Fix ChatInterface.tsx
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
    <div className="flex flex-col h-full">
      <ChatHeader onNewChat={createNewChat} isLoading={loading} />
      
      <div className="flex-1 overflow-auto">
        <ChatList 
          messages={messages} 
          ref={messagesEndRef}
          isLoading={loading}
        />
      </div>
      
      <div className="sticky bottom-0 bg-background border-t border-neutral-800 pt-2 pb-4 px-4">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={loading}
          placeholder="Type your message..."
        />
        
        <ChatFooter isLoading={loading} />
      </div>
    </div>
  );
};

export default ChatInterface;
EOL

echo "All import errors have been fixed!"
