
import { Button } from "@/components/ui/button";
import { Plus, Code, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChatHeaderProps {
  onNewChat: () => void;
  isLoading: boolean;
}

export function ChatHeader({ onNewChat, isLoading }: ChatHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex space-x-2 mb-4 border-b border-border pb-4">
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-secondary/50"
        onClick={onNewChat}
        disabled={isLoading}
      >
        <Plus className="h-4 w-4 mr-2" />
        New Chat
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-secondary/50"
        onClick={() => navigate('/playground')}
      >
        <Code className="h-4 w-4 mr-2" />
        Code Playground
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-secondary/50"
        onClick={() => navigate('/widgets')}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Widgets
      </Button>
    </div>
  );
}
