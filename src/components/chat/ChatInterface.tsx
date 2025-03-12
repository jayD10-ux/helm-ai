
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Code, Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { fadeIn, staggerContainer, slideIn } from "@/components/ui/motion";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

const ChatBubble = ({ message }: { message: Message }) => {
  const isUser = message.sender === "user";
  
  return (
    <motion.div
      variants={slideIn}
      className={cn(
        "max-w-3xl rounded-xl p-4 mb-6",
        isUser 
          ? "ml-auto bg-primary/20 text-white" 
          : "mr-auto glass-morphism"
      )}
    >
      <div className="flex items-center mb-2">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary/40" : "bg-accent/30"
        )}>
          <span className="text-xs font-medium">
            {isUser ? "U" : "AI"}
          </span>
        </div>
        <div className="ml-2">
          <p className="text-sm font-medium">{isUser ? "You" : "Helm AI"}</p>
          <p className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
      <div className="ml-10">
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
};

const ChatInterface = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm Helm AI, your assistant for working with AI models and MCPs (Model Context Protocols). How can I help you today?",
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
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
  
  const handleSendMessage = async () => {
    if (input.trim() === "" || !chatId) return;
    
    try {
      setLoading(true);
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content: input,
        sender: "user",
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      
      // Save user message to Supabase
      await supabase
        .from('messages')
        .insert([{
          content: userMessage.content,
          sender: userMessage.sender,
          chat_id: chatId,
          timestamp: userMessage.timestamp
        }]);
      
      // Call the LLM edge function
      const response = await supabase.functions.invoke('llm-chat', {
        body: { message: userMessage.content, chatId },
      });
      
      console.log('LLM response:', response.data);
      
      // Process the response
      if (response.data && response.data.type === "widget_creation") {
        // Create the widget in the database
        const widgetId = await saveWidgetToDatabase(response.data.widget);
        
        // Add an AI message about widget creation
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `${response.data.message} You can view it in the Widgets page or [click here](#) to see it now.`,
          sender: "ai",
          timestamp: new Date()
        };
        
        setMessages((prev) => [...prev, aiMessage]);
        
        // Save AI message to Supabase
        await supabase
          .from('messages')
          .insert([{
            content: aiMessage.content,
            sender: aiMessage.sender,
            chat_id: chatId,
            timestamp: aiMessage.timestamp
          }]);
          
        // Show a toast notification
        toast({
          title: "Widget Created!",
          description: `"${response.data.widget.name}" has been added to your widgets.`,
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/widgets')}
            >
              View Widgets
            </Button>
          )
        });
      } else {
        // Regular text response
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.data?.message || "I'm processing your request. This is a placeholder response.",
          sender: "ai",
          timestamp: new Date()
        };
        
        setMessages((prev) => [...prev, aiMessage]);
        
        // Save AI message to Supabase
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
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error while processing your message. Please try again later.",
        sender: "ai",
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      // Save error message to Supabase
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
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-6rem)]">
      <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          <AnimatePresence>
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </motion.div>
      </div>
      
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2 mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-secondary/50"
            onClick={createNewChat}
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-secondary/50"
            onClick={() => window.location.href = '/playground'}
          >
            <Code className="h-4 w-4 mr-2" />
            Code Playground
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-secondary/50"
            onClick={() => window.location.href = '/widgets'}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Widgets
          </Button>
        </div>
        
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Try asking to create a widget..."
            className="min-h-[60px] w-full bg-card border border-border rounded-xl pr-12 resize-none"
            disabled={loading}
          />
          <Button
            onClick={handleSendMessage}
            className="absolute right-2 bottom-2 h-8 w-8 p-0"
            disabled={input.trim() === "" || loading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {loading && (
          <p className="text-xs text-muted-foreground mt-2 animate-pulse">
            AI is thinking...
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
