
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

// For development without authentication
const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

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
      
      // First check if the user settings record exists for our temp user
      const { data: existingSettings, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', TEMP_USER_ID)
        .maybeSingle();
        
      // If no settings found for test user, create an empty record
      if (!existingSettings && !checkError) {
        await supabase
          .from('user_settings')
          .insert({ user_id: TEMP_USER_ID, mcp_servers: [] });
      }
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('mcp_servers')
        .eq('user_id', TEMP_USER_ID)
        .maybeSingle();
        
      if (error) {
        console.error('Error loading MCP servers:', error);
        throw error;
      }
      
      if (data && data.mcp_servers) {
        console.log('Loaded MCP servers:', data.mcp_servers);
        setMcpServers(data.mcp_servers);
      } else {
        console.log('No MCP servers found');
        setMcpServers([]);
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
        .upsert({ 
          user_id: TEMP_USER_ID,
          mcp_servers: servers 
        });
        
      if (error) {
        console.error('Error saving MCP servers:', error);
        throw error;
      }
      
      console.log('Saved MCP servers:', servers);
      setMcpServers(servers);
      
      toast({
        title: "MCP servers saved",
        description: "Your MCP server settings have been saved successfully.",
      });
      
      return true;
    } catch (error) {
      console.error('Error saving MCP servers:', error);
      toast({
        title: "Error saving MCP servers",
        description: "Failed to save your MCP server settings.",
        variant: "destructive"
      });
      return false;
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
        return null;
      }
      
      // Check for duplicates
      const isDuplicate = mcpServers.some(server => server.url === url);
      if (isDuplicate) {
        toast({
          title: "Duplicate MCP Server",
          description: "This MCP server URL has already been added.",
          variant: "destructive"
        });
        return null;
      }
      
      // Add the new server
      const newServer: MCPServer = {
        id: Date.now().toString(),
        url: url,
        name: suggestedName,
        connectionType,
        status: "pending" // Explicitly set as one of the allowed values
      };
      
      const updatedServers = [...mcpServers, newServer];
      const saveSuccess = await saveMCPServers(updatedServers);
      
      if (saveSuccess) {
        toast({
          title: "MCP Server Added",
          description: `${suggestedName} has been added successfully.`,
        });
        
        // Automatically test the connection
        testMCPServer(newServer).then(result => {
          // Update the status based on the test result
          const newStatus = result.success ? "connected" as const : "disconnected" as const;
          
          const serverWithUpdatedStatus = {
            ...newServer,
            status: newStatus
          };
          
          const serversWithUpdatedStatus = updatedServers.map(s => 
            s.id === newServer.id ? serverWithUpdatedStatus : s
          );
          
          saveMCPServers(serversWithUpdatedStatus);
        });
        
        return newServer;
      }
      
      return null;
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

      console.log(`Testing ${server.connectionType} connection to: ${server.url}`);

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
            
            eventSource.onerror = (event) => {
              clearTimeout(timeoutId);
              eventSource.close();
              console.error('SSE connection error:', event);
              resolve({ success: false, message: "Failed to connect to SSE endpoint" });
            };
          } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error in SSE connection test:', error);
            reject(error);
          }
        });
        
        const result = await testPromise;
        console.log(`Test result for ${server.url}:`, result);
        
        setTestResults(prev => ({
          ...prev,
          [server.id]: result
        }));
        
        // Update the server status based on the test result - using type assertion
        const newStatus = result.success ? "connected" as const : "disconnected" as const;
        
        const updatedServers = mcpServers.map(s => 
          s.id === server.id 
            ? { ...s, status: newStatus } 
            : s
        );
        
        saveMCPServers(updatedServers);
        
        return result;
      } 
      // For WebSocket connections
      else if (server.connectionType === "websocket") {
        let timeoutId: number;
        const testPromise = new Promise<{ success: boolean; message: string }>((resolve, reject) => {
          try {
            // Convert HTTP/HTTPS to WS/WSS
            const wsUrl = server.url.replace(/^http/, 'ws');
            console.log(`Connecting to WebSocket URL: ${wsUrl}`);
            
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
            
            socket.onerror = (event) => {
              clearTimeout(timeoutId);
              socket.close();
              console.error('WebSocket connection error:', event);
              resolve({ success: false, message: "Failed to connect to WebSocket endpoint" });
            };
          } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error in WebSocket connection test:', error);
            reject(error);
          }
        });
        
        const result = await testPromise;
        console.log(`Test result for ${server.url}:`, result);
        
        setTestResults(prev => ({
          ...prev,
          [server.id]: result
        }));
        
        // Update the server status based on the test result - using type assertion
        const newStatus = result.success ? "connected" as const : "disconnected" as const;
        
        const updatedServers = mcpServers.map(s => 
          s.id === server.id 
            ? { ...s, status: newStatus } 
            : s
        );
        
        saveMCPServers(updatedServers);
        
        return result;
      }
      
      return { success: false, message: "Unknown connection type" };
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
