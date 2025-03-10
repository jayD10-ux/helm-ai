
import { useState } from "react";
import { motion } from "framer-motion";
import { Server, Trash2, Settings, Plus, ExternalLink, Play, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fadeIn, staggerContainer, scaleIn } from "@/components/ui/motion";
import { useMCPServers, MCPServer } from "@/hooks/use-mcp-servers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const MCPCard = ({ 
  mcp, 
  onRemove, 
  onTest, 
  testResult 
}: { 
  mcp: MCPServer;
  onRemove: (id: string) => void;
  onTest: (server: MCPServer) => void;
  testResult?: { success: boolean; message: string };
}) => {
  const [testing, setTesting] = useState(false);
  
  const handleTest = async () => {
    setTesting(true);
    await onTest(mcp);
    setTesting(false);
  };
  
  return (
    <motion.div variants={scaleIn}>
      <Card className="glass-morphism h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-medium">{mcp.name}</CardTitle>
            <Badge variant={mcp.status === "connected" ? "default" : "destructive"} className="ml-2">
              {mcp.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-medium">URL:</span>{" "}
            <a href={mcp.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
              {mcp.url.length > 40 ? `${mcp.url.slice(0, 40)}...` : mcp.url}
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Connection Type:</span>{" "}
            <span className="capitalize">{mcp.connectionType}</span>
          </p>
          
          {testResult && (
            <div className={cn(
              "mt-3 p-2 rounded-md text-sm", 
              testResult.success ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
            )}>
              <div className="flex items-center">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                <span>{testResult.message}</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Test Connection
              </>
            )}
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            className="text-xs"
            onClick={() => onRemove(mcp.id)}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Remove
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const MCPsInterface = () => {
  const { toast } = useToast();
  const {
    mcpServers,
    loading,
    testResults,
    addMCPServer,
    removeMCPServer,
    testMCPServer
  } = useMCPServers();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [newServerUrl, setNewServerUrl] = useState("");
  const [connectionType, setConnectionType] = useState<"sse" | "websocket">("sse");
  const [isVerifying, setIsVerifying] = useState(false);
  
  const filteredMCPs = mcpServers.filter(mcp => 
    mcp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mcp.url.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleAddServer = async () => {
    if (!newServerUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a MCP server URL",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsVerifying(true);
      await addMCPServer(newServerUrl, connectionType);
      setNewServerUrl("");
    } catch (error) {
      console.error("Error adding server:", error);
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleTestServer = async (server: MCPServer) => {
    await testMCPServer(server);
  };
  
  return (
    <motion.div
      {...fadeIn}
      className="h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Model Context Protocols</h1>
          <p className="text-muted-foreground">Connect your AI to external data sources and tools</p>
        </div>
      </div>
      
      <Tabs defaultValue="connected" className="w-full">
        <TabsList className="bg-card w-full justify-start mb-6 p-1">
          <TabsTrigger value="connected" className="flex-1 max-w-[200px] data-[state=active]:bg-secondary">
            Connected Servers
          </TabsTrigger>
          <TabsTrigger value="add" className="flex-1 max-w-[200px] data-[state=active]:bg-secondary">
            Add New Server
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="connected" className="mt-0">
          <div className="mb-6">
            <Input
              placeholder="Search MCP servers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md bg-card border-border"
            />
          </div>
          
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredMCPs.map((mcp) => (
              <MCPCard 
                key={mcp.id} 
                mcp={mcp} 
                onRemove={removeMCPServer} 
                onTest={handleTestServer}
                testResult={testResults[mcp.id]}
              />
            ))}
          </motion.div>
          
          {filteredMCPs.length === 0 && (
            <div className="text-center py-12">
              <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No MCP Servers Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try a different search term" : "Add your first MCP server to get started"}
              </p>
              <Button onClick={() => {
                // Fix the TypeScript error by casting to HTMLElement
                const addTab = document.querySelector('[data-value="add"]') as HTMLElement;
                addTab?.click();
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add MCP Server
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="add" className="mt-0">
          <Card className="glass-morphism mb-6">
            <CardHeader>
              <CardTitle>Add MCP Server</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="mcpUrl">MCP Server URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="mcpUrl"
                    value={newServerUrl}
                    onChange={(e) => setNewServerUrl(e.target.value)}
                    placeholder="https://mcp.example.com/service/id"
                    className="flex-1 bg-card border-border"
                  />
                  <Button 
                    onClick={handleAddServer} 
                    disabled={!newServerUrl.trim() || isVerifying}
                  >
                    {isVerifying ? "Verifying..." : "Add"}
                  </Button>
                </div>
                
                <div className="mt-4">
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
                
                <p className="text-sm text-muted-foreground mt-4">
                  Add Model Context Protocol (MCP) servers to enhance Helm AI with external tools and data sources.
                  You can obtain MCP URLs from services that support the protocol.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">What are MCP Servers?</h3>
            <p className="text-muted-foreground">
              The Model Context Protocol (MCP) is an open standard that enables AI models to securely interact with external tools and data sources.
              By connecting MCP servers, you can enhance Helm AI with capabilities like:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Access to real-time data from APIs</li>
              <li>Integration with your organization's internal tools</li>
              <li>Connection to specialized databases and knowledge bases</li>
              <li>Execution of code in various programming environments</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default MCPsInterface;
