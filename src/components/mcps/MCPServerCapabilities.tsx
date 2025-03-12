
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tool, Package, Database, PanelLeft, Code, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { MCPServer } from "@/hooks/use-mcp-servers";
import { fetchMCPCapabilities } from "@/services/composio";
import { fadeIn } from "@/components/ui/motion";

export interface MCPCapability {
  type: 'tool' | 'resource' | 'prompt';
  name: string;
  description?: string;
  category?: string;
}

const CapabilityItem = ({ capability }: { capability: MCPCapability }) => {
  const getIcon = () => {
    switch (capability.type) {
      case 'tool':
        return <Tool className="h-4 w-4 mr-2" />;
      case 'resource':
        return <Database className="h-4 w-4 mr-2" />;
      case 'prompt':
        return <PanelLeft className="h-4 w-4 mr-2" />;
      default:
        return <Code className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <div className="flex items-start p-3 rounded-md hover:bg-secondary/50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        {getIcon()}
      </div>
      <div className="ml-1">
        <div className="flex items-center">
          <h4 className="text-sm font-medium">{capability.name}</h4>
          <Badge variant="outline" className="ml-2 text-xs">
            {capability.type}
          </Badge>
          {capability.category && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {capability.category}
            </Badge>
          )}
        </div>
        {capability.description && (
          <p className="text-sm text-muted-foreground mt-1">{capability.description}</p>
        )}
      </div>
    </div>
  );
};

const MCPServerCapabilities = ({ server }: { server: MCPServer }) => {
  const [capabilities, setCapabilities] = useState<MCPCapability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCapabilities = async () => {
      if (server.status !== "connected") return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchMCPCapabilities(server);
        setCapabilities(result);
      } catch (err) {
        console.error("Error loading MCP server capabilities:", err);
        setError("Failed to load server capabilities. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    loadCapabilities();
  }, [server]);
  
  const toolCapabilities = capabilities.filter(c => c.type === 'tool');
  const resourceCapabilities = capabilities.filter(c => c.type === 'resource');
  const promptCapabilities = capabilities.filter(c => c.type === 'prompt');

  if (server.status !== "connected") {
    return (
      <Card className="mt-4 bg-card/50">
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Connect to this server to view its capabilities
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="mt-4 bg-card/50">
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading server capabilities...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-4 bg-card/50">
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <p className="text-red-500 mb-2">{error}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchMCPCapabilities(server)
                  .then(result => setCapabilities(result))
                  .catch(err => setError("Failed to load server capabilities. Please try again later."))
                  .finally(() => setLoading(false));
              }}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (capabilities.length === 0) {
    return (
      <Card className="mt-4 bg-card/50">
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <Package className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No capabilities found for this server</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div {...fadeIn} className="mt-4">
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Server Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={toolCapabilities.length > 0 ? "tools" : resourceCapabilities.length > 0 ? "resources" : "prompts"}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="tools" disabled={toolCapabilities.length === 0} className={cn(
                toolCapabilities.length === 0 && "opacity-50 cursor-not-allowed"
              )}>
                <Tool className="h-4 w-4 mr-2" />
                Tools {toolCapabilities.length > 0 && `(${toolCapabilities.length})`}
              </TabsTrigger>
              <TabsTrigger value="resources" disabled={resourceCapabilities.length === 0} className={cn(
                resourceCapabilities.length === 0 && "opacity-50 cursor-not-allowed"
              )}>
                <Database className="h-4 w-4 mr-2" />
                Resources {resourceCapabilities.length > 0 && `(${resourceCapabilities.length})`}
              </TabsTrigger>
              <TabsTrigger value="prompts" disabled={promptCapabilities.length === 0} className={cn(
                promptCapabilities.length === 0 && "opacity-50 cursor-not-allowed"
              )}>
                <PanelLeft className="h-4 w-4 mr-2" />
                Prompts {promptCapabilities.length > 0 && `(${promptCapabilities.length})`}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tools" className="space-y-1">
              {toolCapabilities.length > 0 ? (
                toolCapabilities.map((capability, index) => (
                  <div key={`${capability.name}-${index}`}>
                    <CapabilityItem capability={capability} />
                    {index < toolCapabilities.length - 1 && <Separator className="my-1" />}
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No tools available</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="resources" className="space-y-1">
              {resourceCapabilities.length > 0 ? (
                resourceCapabilities.map((capability, index) => (
                  <div key={`${capability.name}-${index}`}>
                    <CapabilityItem capability={capability} />
                    {index < resourceCapabilities.length - 1 && <Separator className="my-1" />}
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No resources available</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="prompts" className="space-y-1">
              {promptCapabilities.length > 0 ? (
                promptCapabilities.map((capability, index) => (
                  <div key={`${capability.name}-${index}`}>
                    <CapabilityItem capability={capability} />
                    {index < promptCapabilities.length - 1 && <Separator className="my-1" />}
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No prompts available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MCPServerCapabilities;
