
import React, { useState, KeyboardEvent, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, PanelRight, Globe, Lightbulb, Mic } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface ChatInputProps {
  onSendMessage: (message: string, spreadsheetData?: any) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({ 
  onSendMessage, 
  isLoading, 
  placeholder = "Type your message..." 
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [spreadsheetData, setSpreadsheetData] = useState<any>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    if (input.trim() === "" || isLoading) return;
    onSendMessage(input, spreadsheetData);
    setInput("");
    setSpreadsheetData(null);
    setAttachedFileName(null);
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
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv') && !file.name.endsWith('.xls')) {
      toast.error("Please select a valid spreadsheet file (.xlsx, .csv, .xls)");
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convert to array of objects
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      if (jsonData.length === 0) {
        throw new Error("The spreadsheet is empty");
      }
      
      // Extract headers from the first row
      const headers = Object.keys(jsonData[0]);
      
      setSpreadsheetData({
        headers,
        rows: jsonData,
        fileName: file.name,
        lastUpdated: new Date()
      });
      
      setAttachedFileName(file.name);
      toast.success(`${file.name} attached`);
    } catch (error) {
      console.error("Error processing spreadsheet:", error);
      toast.error("Failed to process the spreadsheet file");
    }
    
    // Clear the input value to allow attaching the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      {attachedFileName && (
        <div className="absolute -top-9 left-0 right-0 p-2 bg-neutral-800 text-sm rounded-t-lg flex items-center justify-between">
          <div className="flex items-center">
            <PanelRight className="h-4 w-4 mr-2 text-primary" />
            <span className="truncate max-w-[200px]">{attachedFileName}</span>
          </div>
          <button 
            className="text-neutral-400 hover:text-neutral-200"
            onClick={() => {
              setSpreadsheetData(null);
              setAttachedFileName(null);
            }}
          >
            &times;
          </button>
        </div>
      )}
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={attachedFileName ? `Ask something about ${attachedFileName}...` : placeholder}
        className="min-h-[60px] w-full resize-none border rounded-lg px-3 py-2 pr-32 focus-visible:ring-1 focus-visible:ring-neutral-400 focus-visible:outline-none"
        disabled={isLoading}
      />
      <div className="absolute bottom-2 right-2 flex items-center gap-1">
        <button
          onClick={handleAttachClick}
          className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 transition-colors"
          title="Attach spreadsheet"
        >
          <Paperclip className="h-4 w-4 text-neutral-200" />
          <span className="sr-only">Attach file</span>
        </button>
        <button
          className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 transition-colors"
          title="Web search"
        >
          <Globe className="h-4 w-4 text-neutral-200" />
          <span className="sr-only">Web search</span>
        </button>
        <button
          className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 transition-colors"
          title="Reason step by step"
        >
          <Lightbulb className="h-4 w-4 text-neutral-200" />
          <span className="sr-only">Reason</span>
        </button>
        <button
          className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 transition-colors"
          title="Voice input"
        >
          <Mic className="h-4 w-4 text-neutral-200" />
          <span className="sr-only">Voice input</span>
        </button>
        <button
          onClick={handleSendMessage}
          disabled={input.trim() === "" || isLoading}
          className="p-2 rounded-md bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
        >
          <Send className="h-4 w-4 text-white" />
          <span className="sr-only">Send message</span>
        </button>
      </div>
      <input 
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
      />
    </div>
  );
}
