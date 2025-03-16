
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { User, Bot, CheckCircle2, Play, Terminal, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { executeCode } from "@/services/e2b-service";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [codeOutput, setCodeOutput] = useState<Record<string, { output: string; isError: boolean; isRunning: boolean }>>({});
  
  const detectLanguage = (lang: string): string => {
    if (!lang) return "javascript";
    
    const lowerLang = lang.toLowerCase();
    if (lowerLang === "js") return "javascript";
    if (lowerLang === "ts") return "typescript";
    if (lowerLang === "py") return "python";
    
    return lowerLang;
  };
  
  const executeCodeBlock = async (code: string, language: string, blockIndex: number) => {
    const blockKey = `${blockIndex}-${language}`;
    
    setCodeOutput(prev => ({
      ...prev,
      [blockKey]: { ...prev[blockKey], isRunning: true, output: "", isError: false }
    }));
    
    try {
      const result = await executeCode(code, detectLanguage(language));
      
      let outputText = "";
      
      if (result.stdout) {
        outputText += result.stdout;
      }
      
      if (result.stderr) {
        outputText += (outputText ? "\n\n" : "") + "Errors:\n" + result.stderr;
      }
      
      setCodeOutput(prev => ({
        ...prev,
        [blockKey]: { 
          output: outputText || "No output", 
          isError: result.isError,
          isRunning: false
        }
      }));
    } catch (error) {
      console.error("Error executing code block:", error);
      
      setCodeOutput(prev => ({
        ...prev,
        [blockKey]: { 
          output: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`, 
          isError: true,
          isRunning: false
        }
      }));
    }
  };
  
  // Track code blocks to assign unique indexes
  let codeBlockIndex = 0;
  
  return (
    <div className={`flex items-start gap-3 p-4 ${message.sender === "ai" ? "bg-neutral-900/10" : ""}`}>
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground">
        {message.sender === "user" ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-semibold">{message.sender === "user" ? "You" : "Helm AI"}</div>
          <div className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="prose prose-neutral dark:prose-invert">
          <ReactMarkdown
            components={{
              code: ({ inline, className, children, ...props }) => {
                const language = className ? className.replace("language-", "") : "";
                const isCodeBlock = !inline && className;
                const code = String(children).replace(/\n$/, "");
                
                if (!isCodeBlock) {
                  return <code className={className} {...props}>{children}</code>;
                }
                
                const currentBlockIndex = codeBlockIndex++;
                const blockKey = `${currentBlockIndex}-${language}`;
                const blockOutput = codeOutput[blockKey];
                
                return (
                  <div className="relative">
                    <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-neutral-900">
                      <div className="text-xs font-mono">{language || "javascript"}</div>
                      <Button 
                        size="sm" 
                        className="py-0.5 h-6 text-xs"
                        onClick={() => executeCodeBlock(code, language, currentBlockIndex)}
                        disabled={blockOutput?.isRunning}
                      >
                        {blockOutput?.isRunning ? (
                          <span className="flex items-center">
                            <div className="flex space-x-1 mr-1">
                              <div className="h-1 w-1 rounded-full bg-current animate-pulse"></div>
                              <div className="h-1 w-1 rounded-full bg-current animate-pulse" style={{ animationDelay: "150ms" }}></div>
                              <div className="h-1 w-1 rounded-full bg-current animate-pulse" style={{ animationDelay: "300ms" }}></div>
                            </div>
                            Running...
                          </span>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Run
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="p-4 overflow-auto bg-neutral-900 rounded-b-md">
                      <code className={className} {...props}>{children}</code>
                    </pre>
                    
                    {blockOutput && (blockOutput.output || blockOutput.isRunning) && (
                      <div className="mt-2 border border-border rounded-md overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-neutral-900">
                          <div className="flex items-center">
                            <Terminal className="h-3 w-3 mr-1" />
                            <span className="text-xs">Output</span>
                          </div>
                          {!blockOutput.isRunning && (
                            <div className="flex items-center">
                              {blockOutput.isError ? (
                                <XCircle className="h-3 w-3 text-destructive mr-1" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                              )}
                              <span className={`text-xs ${blockOutput.isError ? 'text-destructive' : 'text-green-500'}`}>
                                {blockOutput.isError ? 'Error' : 'Success'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-4 bg-black/50 font-mono text-xs overflow-auto max-h-[200px]">
                          {blockOutput.isRunning ? (
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse"></div>
                                <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "150ms" }}></div>
                                <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "300ms" }}></div>
                              </div>
                              <span>Executing...</span>
                            </div>
                          ) : (
                            <pre className={cn(blockOutput.isError && "text-destructive")}>{blockOutput.output}</pre>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
