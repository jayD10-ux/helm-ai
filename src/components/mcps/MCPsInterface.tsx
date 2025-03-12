import { useState } from "react";
import { motion } from "framer-motion";
import { Server, Trash2, Play, CheckCircle, XCircle, Loader2, LockIcon, UnlockIcon, Key, RefreshCw, Code, AlertCircle } from "lucide-react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import MCPServerCapabilities from "./MCPServerCapabilities";
import MCPCodeEditor from "./MCPCodeEditor";

const MCPCard = ({ 
  mcp, 
  onRemove, 
  onTest, 
  onAuthenticate,
  testResult 
}: { 
  mcp: MCPServer;
  onRemove: (id: string) => void;
  onTest: (server: MCPServer) => void;
  onAuthenticate: (server: MCPServer) => void;
  testResult?: { success: boolean; message: string };
}) => {
  const [testing, setTesting] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const handleTest = async () => {
    setTesting(true);
    await onTest(mcp);
    setTesting(false);
  };
  
  const handleAuthenticate = async () => {
    setAuthenticating(true);
    await onAuthenticate(mcp);
    setAuthenticating(false);
  };
  
  const renderAuthBanner = () => {
    if (mcp.requiresAuth && !mcp.isAuthenticated) {
      return (
        <Alert variant="default" className="mb-4 bg-amber-500/10 border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            This MCP server requires authentication to access your data. 
            Please authenticate to use this server with the AI assistant.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };
  
  return (
    <motion.div variants={scaleIn}>
      <Card className="glass-morphism h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-medium">{mcp.name}</CardTitle>
            <div className="flex gap-1">
              {mcp.requiresAuth && (
                <Badge variant="outline" className={cn(
                  "ml-2 border", 
                  mcp.isAuthenticated 
                    ? "bg-green-500/10 text-green-600 border-green-200" 
                    : "bg-amber-500/10 text-amber-600 border-amber-200"
                )}>
                  {mcp.isAuthenticated ? (
                    <UnlockIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <LockIcon className="h-3 w-3 mr-1" />
                  )}
                  {mcp.isAuthenticated ? "Authenticated" : "Auth Required"}
                </Badge>
              )}
              <Badge variant={mcp.status === "connected" ? "default" : "destructive"} className="ml-2">
                {mcp.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderAuthBanner()}
          
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-medium">URL:</span>{" "}
            <a href={mcp.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
              {mcp.url.length > 40 ? `${mcp.url.slice(0, 40)}...` : mcp.url}
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
        <CardFooter className="flex flex-col gap-4">
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
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
                    Test
                  </>
                )}
              </Button>
              
              {(mcp.requiresAuth && !mcp.isAuthenticated) && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="text-xs"
                  onClick={handleAuthenticate}
                  disabled={authenticating}
                >
                  {authenticating ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Key className="h-3 w-3 mr-1" />
                      Authenticate
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <Button 
              variant="destructive" 
              size="sm" 
              className="text-xs"
              onClick={() => onRemove(mcp.id)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Remove
            </Button>
          </div>
          
          <Accordion type="single" collapsible className="w-full" value={expanded ? "capabilities" : ""} onValueChange={(val) => setExpanded(val === "capabilities")}>
            <AccordionItem value="capabilities" className="border-none">
              <AccordionTrigger className="py-1 px-2 -mx-2 rounded-md hover:bg-accent/50">
                <span className="text-sm font-medium">Server Capabilities</span>
              </AccordionTrigger>
              <AccordionContent>
                <MCPServerCapabilities server={mcp} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
    testMCPServer,
    authenticateMCPServer
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
  
  const handleAddServerFromCode = async (serverConfig: Partial<MCPServer>) => {
    if (!serverConfig.url || !serverConfig.url.trim()) {
      toast({
        title: "Error",
        description: "Please provide a valid MCP server URL in your code",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      const server = await addMCPServer(
        serverConfig.url, 
        serverConfig.connectionType || "sse",
        serverConfig.name
      );
      return server;
    } catch (error) {
      console.error("Error adding server from code:", error);
      throw error;
    }
  };
  
  const handleTestServer = async (server: MCPServer) => {
    await testMCPServer(server);
  };
  
  const handleAuthenticateServer = async (server: MCPServer) => {
    await authenticateMCPServer(server);
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
          <TabsTrigger value="typescript" className="flex-1 max-w-[200px] data-[state=active]:bg-secondary">
            <Code className="h-4 w-4 mr-2" />
            TypeScript
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="connected" className="mt-0">
          <div className="mb-6 flex items-center justify-between">
            <Input
              placeholder="Search MCP servers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md bg-card border-border"
            />
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
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
                onAuthenticate={handleAuthenticateServer}
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
                const addTab = document.querySelector('[data-value="add"]') as HTMLElement;
                addTab?.click();
              }}>
                <Server className="h-4 w-4 mr-2" />
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
                
                <div className="text-sm text-muted-foreground mt-4 space-y-2">
                  <p>
                    Add Model Context Protocol (MCP) servers to enhance Helm AI with external tools and data sources.
                    You can obtain MCP URLs from services that support the protocol.
                  </p>
                  <p className="font-medium text-primary">
                    Powered by Composio for enhanced MCP compatibility.
                  </p>
                </div>
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
            
            <div className="mt-6 bg-card/50 p-4 rounded-lg border border-border">
              <h4 className="text-lg font-medium mb-2 flex items-center">
                <LockIcon className="h-4 w-4 mr-2" />
                About MCP Authentication
              </h4>
              <p className="text-muted-foreground mb-4">
                Some MCP servers require authentication to access your data. The authentication process follows these steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                <li>Connect to the MCP server by adding its URL</li>
                <li>If the server requires authentication, you'll see an "Auth Required" badge</li>
                <li>Click the "Authenticate" button to start the authentication process</li>
                <li>A new window will open where you can log in to the service</li>
                <li>After successful authentication, the server status will update to "Authenticated"</li>
              </ol>
              <p className="text-muted-foreground mt-4">
                Authentication allows Helm AI to access your data securely using OAuth. Your credentials are never stored by Helm AI.
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="typescript" className="mt-0">
          <MCPCodeEditor onAddServer={handleAddServerFromCode} />
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Using TypeScript with MCP</h3>
            <p className="text-muted-foreground">
              The Model Context Protocol (MCP) can be configured and connected using TypeScript code. 
              This provides more flexibility and allows for integration with existing code bases.
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Define server configurations with TypeScript</li>
              <li>Easily reuse connection code across applications</li>
              <li>Integrate with other TypeScript libraries and frameworks</li>
              <li>Handle advanced connection scenarios</li>
            </ul>
            
            <div className="bg-muted/30 p-4 rounded-md mt-4">
              <h4 className="font-medium mb-2">Example: Connecting to Google Sheets MCP</h4>
              <pre className="text-xs text-muted-foreground overflow-auto">
{`import { McpClient } from "composio-core";

const mcpConfig = {
  url: "https://mcp.composio.dev/googlesheets/your-sheet-id",
  connectionType: "sse"
};

async function connectToGoogleSheets() {
  const client = new McpClient();
  await client.connect(mcpConfig.url);
  
  // Get available capabilities
  const capabilities = await client.getCapabilities();
  console.log("Available capabilities:", capabilities);
  
  return true;
}`}
              </pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default MCPsInterface;

