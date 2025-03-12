
import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
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
    <div className="relative mt-auto">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[60px] w-full resize-none border border-input bg-background px-3 py-2 pr-12 focus-visible:ring-ring"
        disabled={isLoading}
      />
      <Button
        onClick={handleSendMessage}
        size="icon"
        disabled={input.trim() === "" || isLoading}
        className="absolute bottom-2 right-2"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </div>
  );
}
