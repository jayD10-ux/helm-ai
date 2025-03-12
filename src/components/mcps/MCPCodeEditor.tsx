
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { MCPServer } from "@/hooks/use-mcp-servers";

const DEFAULT_CODE_TEMPLATE = `import { McpClient } from "composio-core";

// Define your MCP server configuration
const mcpConfig = {
  url: "https://mcp.example.com/service",
  connectionType: "sse", // or "websocket"
  name: "My MCP Server" // Optional, will be extracted from URL if not provided
};

// Connect to the MCP server
async function connectToMCP() {
  const client = new McpClient();
  await client.connect(mcpConfig.url);
  console.log("Connected to MCP server!");
  return true;
}

// Execute the connection
connectToMCP();
`;

interface MCPCodeEditorProps {
  onAddServer: (server: Partial<MCPServer>) => Promise<MCPServer | null>;
}

const MCPCodeEditor = ({ onAddServer }: MCPCodeEditorProps) => {
  const [code, setCode] = useState(DEFAULT_CODE_TEMPLATE);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };

  const handleRunCode = async () => {
    try {
      setIsProcessing(true);

      // Parse the URL and connection type from the code
      const urlMatch = code.match(/url:\s*["'](.+?)["']/);
      const connectionTypeMatch = code.match(/connectionType:\s*["'](.+?)["']/);
      const nameMatch = code.match(/name:\s*["'](.+?)["']/);

      if (!urlMatch) {
        toast({
          title: "Invalid Code",
          description: "Could not find a valid URL in your code. Make sure to define mcpConfig.url.",
          variant: "destructive"
        });
        return;
      }

      const url = urlMatch[1];
      const connectionType = connectionTypeMatch && connectionTypeMatch[1] === "websocket" 
        ? "websocket" as const 
        : "sse" as const;
      const name = nameMatch ? nameMatch[1] : undefined;

      // Use the existing hook to add the server
      const result = await onAddServer({
        url,
        connectionType,
        name
      });

      if (result) {
        toast({
          title: "MCP Server Added",
          description: `Successfully added ${result.name} using TypeScript.`,
        });
      }
    } catch (error) {
      console.error("Error processing code:", error);
      toast({
        title: "Error",
        description: `Failed to process code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetCode = () => {
    setCode(DEFAULT_CODE_TEMPLATE);
  };

  return (
    <Card className="glass-morphism mb-6">
      <CardHeader>
        <CardTitle>Add MCP Server via TypeScript</CardTitle>
        <CardDescription>
          Write TypeScript code to configure and add your MCP server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <textarea
            value={code}
            onChange={handleCodeChange}
            className="w-full h-80 p-4 font-mono text-sm bg-black/90 text-green-400 rounded-md border border-border resize-none"
            spellCheck="false"
          />
        </div>
        
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleResetCode}>
            Reset Code
          </Button>
          <Button 
            onClick={handleRunCode} 
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? "Processing..." : "Run Code"}
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">Instructions:</p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Modify the mcpConfig object with your MCP server details</li>
            <li>The URL is required and must start with http:// or https://</li>
            <li>Choose connectionType as either "sse" or "websocket"</li>
            <li>Click "Run Code" to add the server</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default MCPCodeEditor;
