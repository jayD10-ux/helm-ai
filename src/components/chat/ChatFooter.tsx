
import { useMCPServers } from "@/hooks/use-mcp-servers";

interface ChatFooterProps {
  isLoading: boolean;
}

export function ChatFooter({ isLoading }: ChatFooterProps) {
  const { mcpServers } = useMCPServers();
  
  return (
    <div className="mt-2 text-xs text-muted-foreground">
      {isLoading && (
        <p className="animate-pulse mb-1">
          AI is thinking...
        </p>
      )}
      {mcpServers.filter(s => s.status === "connected").length > 0 && (
        <p>
          {mcpServers.filter(s => s.status === "connected").length} MCP server(s) connected and available for queries.
        </p>
      )}
    </div>
  );
}
