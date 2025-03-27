import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMCPServers } from "@/hooks/use-mcp-servers";
import { supabase } from "@/lib/supabase";
import { fetchMCPCapabilities } from "@/services/composio";
import { sendChatMessage } from "@/services/llm-service";
import { executeCode } from "@/services/e2b-service";
import { ChatList } from "./ChatList";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";
import { ChatFooter } from "./ChatFooter";
import { ChatHistory } from "./ChatHistory";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DashboardDisplay from "../dashboard/DashboardDisplay";

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
  code?: string;
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

interface SpreadsheetData {
  headers: string[];
  rows: any[];
  fileName: string;
  lastUpdated: Date;
}

const ChatInterface = () => {
  const navigate = useNavigate();
  const { mcpServers } = useMCPServers();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm Helm AI, your assistant for data analysis and visualization. You can attach a spreadsheet and ask me to create dashboards with your data.",
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardCode, setDashboardCode] = useState<string | null>(null);
  const [currentSpreadsheetData, setCurrentSpreadsheetData] = useState<SpreadsheetData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    const loadInitialChat = async () => {
      try {
        const { data: allChats, error: historyError } = await supabase
          .from('chats')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (historyError) throw historyError;
        
        if (allChats) {
          setChatHistory(allChats);
        }
        
        const { data: chats, error: chatError } = await supabase
          .from('chats')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (chatError) throw chatError;
        
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
          createNewChat();
        }
      } catch (error) {
        console.error('Error loading chat:', error);
        toast.error("Error loading chat history: Failed to load your previous conversations.");
      }
    };
    
    loadInitialChat();
  }, []);
  
  const createNewChat = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chats')
        .insert([{ title: 'New Conversation' }])
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setChatId(data[0].id);
        
        const welcomeMessage = {
          id: "1",
          content: "Hello! I'm Helm AI, your assistant for data analysis and visualization. You can attach a spreadsheet and ask me to create dashboards with your data.",
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
        
        setChatHistory(prev => [data[0], ...prev]);
        
        toast.success("New chat created: Started a fresh conversation with Helm AI.");
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast.error("Error creating new chat: Failed to start a new conversation.");
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
      
      setHistoryOpen(false);
    } catch (error) {
      console.error('Error loading chat:', error);
      toast.error("Error loading chat: Failed to load the selected conversation.");
    } finally {
      setLoading(false);
    }
  };

  const isDashboardRequest = (message: string): boolean => {
    const dashboardKeywords = [
      'create dashboard', 'generate dashboard', 'build dashboard', 
      'dashboard with', 'make dashboard', 'show dashboard',
      'visualize data', 'create visualization', 'chart', 'graph'
    ];
    
    const lowerMessage = message.toLowerCase();
    return dashboardKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  const generateDashboardCode = async (query: string, data: SpreadsheetData) => {
    try {
      const prompt = `
Generate a React dashboard using the following spreadsheet data:
- Filename: ${data.fileName}
- Headers: ${JSON.stringify(data.headers)}
- Data sample: ${JSON.stringify(data.rows.slice(0, 5))}

User query: "${query}"

Create a comprehensive dashboard with Tailwind CSS and shadcn UI components that includes:
1. Summary statistics for key metrics
2. Appropriate charts based on the data (bar, line, pie, etc.)
3. Data tables where appropriate
4. Responsive layout

The dashboard should be organized, visually appealing, and specifically address the user's query.
Use react-charts library if needed for data visualization.

The dashboard code should be complete and standalone, ready to render in a React component.
Dashboard data should come from the 'data' prop (don't use the sample data directly).

Only include the React component code, no imports or exports.
      `;

      const { data: response, error } = await supabase.functions.invoke("openai-chat", {
        body: {
          content: prompt,
          systemPrompt: "You are an expert dashboard and data visualization developer. You excel at creating React components with Tailwind CSS and shadcn/ui.",
          modelType: "gpt-4o",
          debugMode: false
        }
      });

      if (error) {
        throw new Error(`Failed to generate dashboard code: ${error.message}`);
      }

      if (!response || !response.text) {
        throw new Error("Empty response from OpenAI");
      }

      const codePattern = /```(?:jsx|tsx)?\s*([\s\S]*?)```/;
      const codeMatch = response.text.match(codePattern);
      
      if (!codeMatch || !codeMatch[1]) {
        throw new Error("No code found in the generated response");
      }

      return codeMatch[1];
    } catch (error) {
      console.error("Error generating dashboard code:", error);
      throw error;
    }
  };

  const handleDashboardGeneration = async (userMessage: string, spreadsheetData: SpreadsheetData) => {
    try {
      setLoading(true);
      setCurrentSpreadsheetData(spreadsheetData);
      
      const userRequestMessage = {
        id: Date.now().toString(),
        content: "I'm generating a dashboard for you based on your spreadsheet data. This may take a moment...",
        sender: "ai" as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userRequestMessage]);
      
      const code = await generateDashboardCode(userMessage, spreadsheetData);
      
      const fullComponentCode = `
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

${code}
      `.trim();
      
      setDashboardCode(fullComponentCode);
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: "I've generated a dashboard based on your data. Let me render it for you.",
        sender: "ai" as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowDashboard(true);
      
      const successMessage = {
        id: (Date.now() + 2).toString(),
        content: "Dashboard created successfully! You can explore your data visually now.",
        sender: "ai" as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, successMessage]);
      
      toast.success("Dashboard generated successfully");
      
    } catch (error) {
      console.error("Error generating dashboard:", error);
      
      const errorMessage = {
        id: Date.now().toString(),
        content: `I encountered an error while generating the dashboard: ${error instanceof Error ? error.message : "Unknown error"}. Please try again with a more specific query.`,
        sender: "ai" as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast.error("Failed to generate dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (input: string, spreadsheetData?: any) => {
    if (input.trim() === "" || !chatId) return;
    
    try {
      setLoading(true);
      const userMessage: Message = {
        id: Date.now().toString(),
        content: spreadsheetData 
          ? `${input} (with spreadsheet: ${spreadsheetData.fileName})` 
          : input,
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
      
      if (spreadsheetData && isDashboardRequest(input)) {
        await handleDashboardGeneration(input, spreadsheetData);
        return;
      }
      
      const mcpData = spreadsheetData ? null : await checkForMCPRelevance(userMessage.content);
      console.log("MCP data for request:", mcpData);
      
      const response = await sendChatMessage({
        content: spreadsheetData 
          ? `The user has uploaded a spreadsheet named "${spreadsheetData.fileName}" with columns: ${spreadsheetData.headers.join(', ')}. Their query is: ${input}` 
          : userMessage.content,
        chatId: chatId
      });
      
      console.log('LLM response:', response);
      
      if (response.type === "widget_creation" && response.widget) {
        const { code, ...widgetForDb } = response.widget;
        
        const widgetId = await saveWidgetToDatabase(widgetForDb);
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `${response.message} You can view it in the Widgets page or [click here](#) to see it now.`,
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
          
        toast.success("Widget Created!", {
          action: {
            label: "View Widgets",
            onClick: () => navigate('/widgets')
          }
        });
      } else {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.message || "I'm processing your request. This is a placeholder response.",
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
      toast.error("Error sending message: Failed to send your message.");
      
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
  
  return (
    <div className="flex flex-col h-full relative">
      <ChatHeader 
        onNewChat={createNewChat} 
        isLoading={loading} 
        onHistoryClick={() => setHistoryOpen(true)}
      />
      
      {showDashboard && dashboardCode && currentSpreadsheetData ? (
        <div className="flex-1 overflow-auto mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Generated Dashboard</h2>
            <Button 
              variant="outline" 
              onClick={() => setShowDashboard(false)}
            >
              Return to Chat
            </Button>
          </div>
          <DashboardDisplay 
            code={dashboardCode} 
            data={currentSpreadsheetData} 
          />
        </div>
      ) : (
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
      )}
      
      <div className="fixed bottom-0 right-0 bg-background pt-2 pb-4 z-10 w-[calc(100%-80px)]">
        <div className="max-w-[1200px] mx-auto px-4">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={loading}
            placeholder="Ask me about your data or attach a spreadsheet..."
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
