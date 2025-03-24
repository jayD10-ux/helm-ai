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
