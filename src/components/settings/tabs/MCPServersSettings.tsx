
import { useState } from "react";
import { PlusCircle, Server, Link, Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export interface MCPServer {
  id: string;
  url: string;
  name: string;
  connectionType: "sse" | "websocket";
  status: "connected" | "disconnected" | "pending";
}

interface MCPServersSettingsProps {
  mcpServers: MCPServer[];
  setMcpServers: (servers: MCPServer[]) => void;
}

const MCPServersSettings = ({ mcpServers, setMcpServers }: MCPServersSettingsProps) => {
  const { toast } = useToast();
  const [newServerUrl, setNewServerUrl] = useState("");
  const [connectionType, setConnectionType] = useState<"sse" | "websocket">("sse");
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyAndAddServer = async () => {
    if (!newServerUrl.trim()) return;
    
    try {
      setIsVerifying(true);
      
      // Extract name from URL
      const urlObj = new URL(newServerUrl);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      const suggestedName = pathSegments.length > 0 ? 
        pathSegments[pathSegments.length - 1] : urlObj.hostname;
      
      // Basic validation - in a real implementation we would verify the server responds correctly
      const isValid = newServerUrl.startsWith('http');
      
      if (!isValid) {
        toast({
          title: "Invalid MCP URL",
          description: "Please enter a valid URL for the MCP server.",
          variant: "destructive"
        });
        return;
      }
      
      // Add the new server
      const newServer: MCPServer = {
        id: Date.now().toString(),
        url: newServerUrl,
        name: suggestedName,
        connectionType,
        status: "connected" // We're simulating a successful connection
      };
      
      setMcpServers([...mcpServers, newServer]);
      setNewServerUrl("");
      
      toast({
        title: "MCP Server Added",
        description: `${suggestedName} has been added successfully.`,
      });
    } catch (error) {
      console.error('Error adding MCP server:', error);
      toast({
        title: "Error Adding Server",
        description: "Failed to add the MCP server. Please check the URL and try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  const removeServer = (id: string) => {
    setMcpServers(mcpServers.filter(server => server.id !== id));
    toast({
      title: "MCP Server Removed",
      description: "The server has been removed from your connections."
    });
  };
  
  return (
    <Card className="glass-morphism mb-6">
      <CardHeader>
        <CardTitle>MCP Servers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="mcpUrl">Add MCP Server</Label>
          <div className="flex gap-2">
            <Input
              id="mcpUrl"
              value={newServerUrl}
              onChange={(e) => setNewServerUrl(e.target.value)}
              placeholder="https://mcp.example.com/service/id"
              className="flex-1 bg-card border-border"
            />
            <Button 
              onClick={verifyAndAddServer} 
              disabled={!newServerUrl.trim() || isVerifying}
            >
              {isVerifying ? "Verifying..." : "Add"}
            </Button>
          </div>
          
          <div className="mt-2">
            <Label htmlFor="connectionType">Connection Type</Label>
            <div className="flex mt-1 space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="sse"
                  name="connectionType"
                  value="sse"
                  checked={connectionType === "sse"}
                  onChange={() => setConnectionType("sse")}
                  className="mr-2"
                />
                <label htmlFor="sse">Server-Sent Events (SSE)</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="websocket"
                  name="connectionType"
                  value="websocket"
                  checked={connectionType === "websocket"}
                  onChange={() => setConnectionType("websocket")}
                  className="mr-2"
                />
                <label htmlFor="websocket">WebSocket</label>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            Add Model Context Protocol (MCP) servers to enhance Helm AI with external tools and data sources.
          </p>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-medium">Connected MCP Servers</h3>
          
          {mcpServers.length === 0 ? (
            <div className="text-center py-4 border border-dashed border-border rounded-md">
              <Server className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No MCP servers connected yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add your first MCP server to extend Helm AI's capabilities
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mcpServers.map((server) => (
                <div key={server.id} className="flex items-center justify-between p-3 bg-card/50 rounded-md border border-border">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <Server className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{server.name}</div>
                      <div className="text-xs flex items-center">
                        <Link className="h-3 w-3 mr-1" />
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          {server.url}
                        </span>
                        <ArrowRight className="h-3 w-3 mx-1 text-muted-foreground" />
                        <span className="capitalize">{server.connectionType}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`flex items-center mr-4 ${
                      server.status === "connected" ? "text-green-500" : "text-amber-500"
                    }`}>
                      {server.status === "connected" ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <div className="h-2 w-2 bg-amber-500 rounded-full mr-1" />
                      )}
                      <span className="text-xs capitalize">{server.status}</span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeServer(server.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MCPServersSettings;
