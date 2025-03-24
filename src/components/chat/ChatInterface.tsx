import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useMCPServers } from "@/hooks/use-mcp-servers";
import { supabase } from "@/lib/supabase";
import { fetchMCPCapabilities } from "@/services/composio";
import { sendChatMessage } from "@/services/llm-service";
import { ChatList } from "./ChatList";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";
import { ChatFooter } from "./ChatFooter";
import { ChatHistory } from "./ChatHistory";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useSpreadsheet } from "@/context/SpreadsheetContext";
import { ParsedSpreadsheet } from "@/services/spreadsheet-service";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  attachedFile?: {
    name: string;
    type: string;
  };
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
      const { data, error } = await supabase
        .from('chats')
        .insert([{ title: 'New Conversation' }])
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setChatId(data[0].id);
        
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

  const saveWidgetToDatabase = async (widgetData: any) => {
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
    
    const mcpData: any[] = [];
    
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
  
  const { setSpreadsheetData } = useSpreadsheet();
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  
  const handleFileAttach = (file: File, parsedData: ParsedSpreadsheet) => {
    setAttachedFile(file);
    
    // Save the parsed data to the spreadsheet context
    setSpreadsheetData({
      headers: parsedData.headers,
      rows: parsedData.rows,
      fileName: parsedData.fileName,
      lastUpdated: new Date()
    });
  };
  
  const handleSendMessage = async (input: string) => {
    if (input.trim() === "" || !chatId) return;
    
    try {
      setLoading(true);
      const userMessage: Message = {
        id: Date.now().toString(),
        content: input,
        sender: "user",
        timestamp: new Date(),
        ...(attachedFile && {
          attachedFile: {
            name: attachedFile.name,
            type: attachedFile.type
          }
        })
      };
      
      setMessages((prev) => [...prev, userMessage]);
      
      await supabase
        .from('messages')
        .insert([{
          content: userMessage.content,
          sender: userMessage.sender,
          chat_id: chatId,
          timestamp: userMessage.timestamp,
          ...(attachedFile && {
            attached_file: {
              name: attachedFile.name,
              type: attachedFile.type
            }
          })
        }]);
      
      // Clear the attached file after sending
      setAttachedFile(null);
      
      const mcpData = await checkForMCPRelevance(userMessage.content);
      console.log("MCP data for request:", mcpData);
      
      // If there's an attached file, suggest going to the spreadsheet dashboard
      if (attachedFile) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `I see you've attached a spreadsheet named "${attachedFile.name}". Would you like to explore this data in the Spreadsheet Dashboard? You can ask questions about your data and generate visualizations there.`,
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
          title: "Spreadsheet attached",
          description: "Your spreadsheet is ready for analysis.",
          action: (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate('/spreadsheet')}
            >
              Go to Dashboard
            </Button>
          )
        });
      } else {
        const response = await sendChatMessage({
          content: userMessage.content,
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
            
          toast({
            title: "Widget Created!",
            description: `"${response.widget.name}" has been added to your widgets.`,
            action: (
              <Button 
                variant="outline"
                className="px-2 py-1 text-xs"
                onClick={() => navigate('/widgets')}
              >
                View Widgets
              </Button>
            )
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
    <div className="flex flex-col items-center justify-center h-full relative">
      <div className="w-full max-w-2xl px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-6 text-white">What can I help with?</h1>
        </div>
        
        <ChatInput 
          onSendMessage={handleSendMessage} 
          onFileAttach={handleFileAttach}
          isLoading={loading}
          placeholder="Ask anything"
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
