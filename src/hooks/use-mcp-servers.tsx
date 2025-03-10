
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export interface MCPServer {
  id: string;
  url: string;
  name: string;
  connectionType: "sse" | "websocket";
  status: "connected" | "disconnected" | "pending";
}

export const useMCPServers = () => {
  const { toast } = useToast();
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  useEffect(() => {
    loadMCPServers();
  }, []);

  const loadMCPServers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('mcp_servers')
        .limit(1)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data && data.mcp_servers) {
        setMcpServers(data.mcp_servers);
      }
    } catch (error) {
      console.error('Error loading MCP servers:', error);
      toast({
        title: "Error loading MCP servers",
        description: "Failed to load your saved MCP servers.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMCPServers = async (servers: MCPServer[]) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({ mcp_servers: servers }, { onConflict: 'user_id' });
        
      if (error) throw error;
      
      setMcpServers(servers);
      
      toast({
        title: "MCP servers saved",
        description: "Your MCP server settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving MCP servers:', error);
      toast({
        title: "Error saving MCP servers",
        description: "Failed to save your MCP server settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addMCPServer = async (url: string, connectionType: "sse" | "websocket") => {
    if (!url.trim()) return;
    
    try {
      setLoading(true);
      
      // Extract name from URL
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      const suggestedName = pathSegments.length > 0 ? 
        pathSegments[pathSegments.length - 1] : urlObj.hostname;
      
      // Basic validation
      const isValid = url.startsWith('http');
      
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
        url: url,
        name: suggestedName,
        connectionType,
        status: "connected" // We're simulating a successful connection
      };
      
      const updatedServers = [...mcpServers, newServer];
      await saveMCPServers(updatedServers);
      
      toast({
        title: "MCP Server Added",
        description: `${suggestedName} has been added successfully.`,
      });

      return newServer;
    } catch (error) {
      console.error('Error adding MCP server:', error);
      toast({
        title: "Error Adding Server",
        description: "Failed to add the MCP server. Please check the URL and try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const removeMCPServer = async (id: string) => {
    try {
      const updatedServers = mcpServers.filter(server => server.id !== id);
      await saveMCPServers(updatedServers);
      
      toast({
        title: "MCP Server Removed",
        description: "The server has been removed from your connections."
      });
    } catch (error) {
      console.error('Error removing MCP server:', error);
      toast({
        title: "Error",
        description: "Failed to remove the MCP server.",
        variant: "destructive"
      });
    }
  };

  const testMCPServer = async (server: MCPServer) => {
    try {
      setTestResults(prev => ({
        ...prev,
        [server.id]: { success: false, message: "Testing connection..." }
      }));

      // For SSE connections
      if (server.connectionType === "sse") {
        let timeoutId: number;
        const testPromise = new Promise<{ success: boolean; message: string }>((resolve, reject) => {
          try {
            const eventSource = new EventSource(server.url);
            
            // Set a timeout to close the connection if it takes too long
            timeoutId = window.setTimeout(() => {
              eventSource.close();
              resolve({ success: false, message: "Connection timed out after 5 seconds" });
            }, 5000);
            
            eventSource.onopen = () => {
              clearTimeout(timeoutId);
              eventSource.close();
              resolve({ success: true, message: "Successfully connected to SSE endpoint" });
            };
            
            eventSource.onerror = () => {
              clearTimeout(timeoutId);
              eventSource.close();
              resolve({ success: false, message: "Failed to connect to SSE endpoint" });
            };
          } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
          }
        });
        
        const result = await testPromise;
        setTestResults(prev => ({
          ...prev,
          [server.id]: result
        }));
        
        return result;
      } 
      // For WebSocket connections
      else if (server.connectionType === "websocket") {
        let timeoutId: number;
        const testPromise = new Promise<{ success: boolean; message: string }>((resolve, reject) => {
          try {
            const wsUrl = server.url.replace(/^http/, 'ws');
            const socket = new WebSocket(wsUrl);
            
            // Set a timeout to close the connection if it takes too long
            timeoutId = window.setTimeout(() => {
              socket.close();
              resolve({ success: false, message: "Connection timed out after 5 seconds" });
            }, 5000);
            
            socket.onopen = () => {
              clearTimeout(timeoutId);
              socket.close();
              resolve({ success: true, message: "Successfully connected to WebSocket endpoint" });
            };
            
            socket.onerror = () => {
              clearTimeout(timeoutId);
              socket.close();
              resolve({ success: false, message: "Failed to connect to WebSocket endpoint" });
            };
          } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
          }
        });
        
        const result = await testPromise;
        setTestResults(prev => ({
          ...prev,
          [server.id]: result
        }));
        
        return result;
      }
    } catch (error) {
      console.error('Error testing MCP server:', error);
      const errorResult = { 
        success: false, 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
      
      setTestResults(prev => ({
        ...prev,
        [server.id]: errorResult
      }));
      
      return errorResult;
    }
  };

  return {
    mcpServers,
    loading,
    testResults,
    loadMCPServers,
    addMCPServer,
    removeMCPServer,
    testMCPServer
  };
};
