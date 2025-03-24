
import React, { useState, useRef, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Send, Plus, Globe, Lightbulb, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { parseSpreadsheetFile } from "@/services/spreadsheet-service";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileAttach?: (file: File, parsedData: any) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({ 
  onSendMessage, 
  onFileAttach,
  isLoading, 
  placeholder = "Ask anything"
}: ChatInputProps) {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if the file is a spreadsheet
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid Excel or CSV file",
        variant: "destructive",
      });
      return;
    }

    try {
      if (onFileAttach) {
        const parsedData = await parseSpreadsheetFile(file);
        onFileAttach(file, parsedData);
        toast({
          title: "File attached",
          description: `${file.name} has been attached to your message.`,
        });
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error processing file",
        description: "The file could not be processed.",
        variant: "destructive",
      });
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      
      <div className="absolute bottom-2 left-2 flex space-x-1">
        <button
          onClick={handleAttachClick}
          className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
          aria-label="Attach file"
        >
          <Plus className="h-4 w-4 text-neutral-400" />
        </button>
        
        <button
          className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
          aria-label="Web search"
        >
          <Globe className="h-4 w-4 text-neutral-400" />
        </button>
        
        <button
          className="flex items-center space-x-1 px-3 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
        >
          <Lightbulb className="h-4 w-4 text-neutral-400" />
          <span className="text-sm text-neutral-400">Reason</span>
        </button>
      </div>
      
      <button
        onClick={handleSendMessage}
        disabled={input.trim() === "" || isLoading}
        className="absolute bottom-2 right-2 p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:hover:bg-neutral-800 transition-colors"
      >
        <Send className="h-4 w-4 text-neutral-200" />
        <span className="sr-only">Send message</span>
      </button>
      
      <button
        className="absolute right-14 bottom-2 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
        aria-label="Voice input"
      >
        <Mic className="h-4 w-4 text-neutral-200" />
      </button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />
    </div>
  );
}
