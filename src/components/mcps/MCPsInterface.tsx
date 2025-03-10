
import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Plus, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fadeIn, staggerContainer, scaleIn } from "@/components/ui/motion";

interface MCP {
  id: string;
  name: string;
  description: string;
  source: string;
  category: string;
}

const mockMCPs: MCP[] = [
  {
    id: "1",
    name: "Weather API",
    description: "Access real-time weather data from around the world",
    source: "OpenWeather",
    category: "Data"
  },
  {
    id: "2",
    name: "Code Executor",
    description: "Run and execute code snippets in various languages",
    source: "CodeSandbox",
    category: "Development"
  },
  {
    id: "3",
    name: "Financial Data",
    description: "Access stock market and financial data",
    source: "Alpha Vantage",
    category: "Finance"
  }
];

const MCPCard = ({ mcp }: { mcp: MCP }) => {
  return (
    <motion.div variants={scaleIn}>
      <Card className="glass-morphism h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-medium">{mcp.name}</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {mcp.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{mcp.description}</p>
          <p className="text-xs mt-2">Source: <span className="text-primary">{mcp.source}</span></p>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <Button variant="outline" size="sm" className="text-xs">
            <Settings className="h-3 w-3 mr-1" />
            Configure
          </Button>
          <Button variant="destructive" size="sm" className="text-xs">
            <Trash2 className="h-3 w-3 mr-1" />
            Remove
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const MCPsInterface = () => {
  const [mcps, setMcps] = useState<MCP[]>(mockMCPs);
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredMCPs = mcps.filter(mcp => 
    mcp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mcp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mcp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <motion.div
      {...fadeIn}
      className="h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Model Context Protocols</h1>
          <p className="text-muted-foreground">Connect your AI to external data sources</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add New MCP
        </Button>
      </div>
      
      <div className="mb-6">
        <Input
          placeholder="Search MCPs..."
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
          <MCPCard key={mcp.id} mcp={mcp} />
        ))}
      </motion.div>
      
      {filteredMCPs.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No MCPs Found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Try a different search term" : "Add your first MCP to get started"}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default MCPsInterface;
