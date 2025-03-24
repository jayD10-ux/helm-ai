
import React from "react";
import { useMCPServers } from "@/hooks/use-mcp-servers";

interface ChatFooterProps {
  isLoading: boolean;
}

export function ChatFooter({ isLoading }: ChatFooterProps) {
  const { mcpServers } = useMCPServers();
  
  return (
    <div className="mt-2 text-xs text-center text-muted-foreground">
      {isLoading && (
        <div className="flex items-center justify-center space-x-2 mb-1">
          <div className="flex space-x-1">
            <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "0ms" }}></div>
            <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "300ms" }}></div>
            <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "600ms" }}></div>
          </div>
          <span>AI is thinking...</span>
        </div>
      )}
      {mcpServers.filter(s => s.status === "connected").length > 0 && (
        <p className="text-neutral-500 mt-4">
          {mcpServers.filter(s => s.status === "connected").length} MCP server(s) connected
        </p>
      )}
    </div>
  );
}
