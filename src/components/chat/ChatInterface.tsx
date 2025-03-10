
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Code, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { fadeIn, staggerContainer, slideIn } from "@/components/ui/motion";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm Helm AI, your assistant for working with AI models and MCPs (Model Context Protocols). How can I help you today?",
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = () => {
    if (input.trim() === "") return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    
    // Simulate AI response (would be replaced with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm processing your request. This is a placeholder response that would be replaced with actual AI-generated content based on your input.",
        sender: "ai",
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
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
          <Button variant="outline" size="sm" className="bg-secondary/50">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          <Button variant="outline" size="sm" className="bg-secondary/50">
            <Code className="h-4 w-4 mr-2" />
            Code Playground
          </Button>
        </div>
        
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Helm AI..."
            className="min-h-[60px] w-full bg-card border border-border rounded-xl pr-12 resize-none"
          />
          <Button
            onClick={handleSendMessage}
            className="absolute right-2 bottom-2 h-8 w-8 p-0"
            disabled={input.trim() === ""}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
