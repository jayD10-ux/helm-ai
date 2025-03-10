import { useState, useEffect, useRef } from "react";
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
  
  // Store active connections to clean them up when needed
  const activeConnections = useRef<Record<string, EventSource | WebSocket>>({});

  useEffect(() => {
    loadMCPServers();
    
    // Clean up any active connections when component unmounts
    return () => {
      Object.values(activeConnections.current).forEach(connection => {
        if (connection instanceof EventSource) {
          connection.close();
        } else if (connection instanceof WebSocket) {
          connection.close();
        }
      });
    };
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
        
      console.log("Checking for existing settings:", { existingSettings, checkError });
        
      // If no settings found for test user, create an empty record
      if (!existingSettings && !checkError) {
        console.log("No settings found, creating new record");
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
      
      // Add detailed logging to diagnose the issue
      console.log("About to save MCP servers:", servers);
      
      // Check if a record already exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', TEMP_USER_ID)
        .maybeSingle();
      
      console.log("Check for existing record result:", { existingRecord, checkError });
      
      let result;
      
      // If record exists, use update instead of upsert
      if (existingRecord) {
        console.log("Updating existing record with id:", existingRecord.id);
        result = await supabase
          .from('user_settings')
          .update({ mcp_servers: servers })
          .eq('user_id', TEMP_USER_ID);
      } else {
        console.log("No existing record found, inserting new one");
        result = await supabase
          .from('user_settings')
          .insert({ 
            user_id: TEMP_USER_ID,
            mcp_servers: servers 
          });
      }
      
      const { error } = result;
        
      if (error) {
        console.error('Error saving MCP servers:', error);
        throw error;
      }
      
      console.log('Successfully saved MCP servers:', servers);
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
      // Close any active connections for this server
      if (activeConnections.current[id]) {
        if (activeConnections.current[id] instanceof EventSource) {
          (activeConnections.current[id] as EventSource).close();
        } else if (activeConnections.current[id] instanceof WebSocket) {
          (activeConnections.current[id] as WebSocket).close();
        }
        delete activeConnections.current[id];
      }
      
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
      // Close any existing connection for this server
      if (activeConnections.current[server.id]) {
        if (activeConnections.current[server.id] instanceof EventSource) {
          (activeConnections.current[server.id] as EventSource).close();
        } else if (activeConnections.current[server.id] instanceof WebSocket) {
          (activeConnections.current[server.id] as WebSocket).close();
        }
        delete activeConnections.current[server.id];
      }
      
      setTestResults(prev => ({
        ...prev,
        [server.id]: { success: false, message: "Testing connection..." }
      }));

      console.log(`Testing ${server.connectionType} connection to: ${server.url}`);

      // For SSE connections
      if (server.connectionType === "sse") {
        let timeoutId: number;
        
        // Create URL object to handle query parameters properly
        const urlObj = new URL(server.url);
        
        // Add a cache-busting parameter to prevent cached responses
        urlObj.searchParams.append('_', Date.now().toString());
        
        const testPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
          try {
            // Configure EventSource with withCredentials: true to send cookies if needed
            const eventSource = new EventSource(urlObj.toString(), { withCredentials: false });
            
            // Store the connection
            activeConnections.current[server.id] = eventSource;
            
            // Set a timeout to close the connection if it takes too long
            timeoutId = window.setTimeout(() => {
              console.log("SSE connection timed out");
              eventSource.close();
              delete activeConnections.current[server.id];
              resolve({ success: false, message: "Connection timed out after 5 seconds" });
            }, 5000);
            
            eventSource.onopen = () => {
              console.log("SSE connection opened successfully");
              clearTimeout(timeoutId);
              
              // Keep the connection open for future use
              resolve({ success: true, message: "Successfully connected to SSE endpoint" });
            };
            
            eventSource.onmessage = (event) => {
              console.log("SSE message received:", event.data);
              // We don't close the connection here to keep receiving messages
            };
            
            eventSource.onerror = (event) => {
              console.error('SSE connection error:', event);
              clearTimeout(timeoutId);
              eventSource.close();
              delete activeConnections.current[server.id];
              
              // Check if the server might require authentication
              if (event instanceof Event && 'status' in event.target && (event.target as any).status === 401) {
                resolve({ success: false, message: "Authentication required for SSE endpoint" });
              } else {
                resolve({ success: false, message: "Failed to connect to SSE endpoint" });
              }
            };
          } catch (error) {
            console.error('Error in SSE connection test:', error);
            clearTimeout(timeoutId);
            delete activeConnections.current[server.id];
            resolve({ 
              success: false, 
              message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
            });
          }
        });
        
        const result = await testPromise;
        console.log(`Test result for ${server.url}:`, result);
        
        setTestResults(prev => ({
          ...prev,
          [server.id]: result
        }));
        
        // Update the server status based on the test result
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
        
        const testPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
          try {
            // Convert HTTP/HTTPS to WS/WSS
            const wsUrl = server.url.replace(/^http/, 'ws');
            console.log(`Connecting to WebSocket URL: ${wsUrl}`);
            
            // Add a cache-busting parameter
            const urlWithCacheBuster = new URL(wsUrl);
            urlWithCacheBuster.searchParams.append('_', Date.now().toString());
            
            const socket = new WebSocket(urlWithCacheBuster.toString());
            
            // Store the connection
            activeConnections.current[server.id] = socket;
            
            // Set a timeout to close the connection if it takes too long
            timeoutId = window.setTimeout(() => {
              console.log("WebSocket connection timed out");
              socket.close();
              delete activeConnections.current[server.id];
              resolve({ success: false, message: "Connection timed out after 5 seconds" });
            }, 5000);
            
            socket.onopen = () => {
              console.log("WebSocket connection opened successfully");
              clearTimeout(timeoutId);
              // Keep the connection open for future use
              resolve({ success: true, message: "Successfully connected to WebSocket endpoint" });
            };
            
            socket.onmessage = (event) => {
              console.log("WebSocket message received:", event.data);
              // We don't close the connection here to keep receiving messages
            };
            
            socket.onerror = (event) => {
              console.error('WebSocket connection error:', event);
              clearTimeout(timeoutId);
              socket.close();
              delete activeConnections.current[server.id];
              resolve({ success: false, message: "Failed to connect to WebSocket endpoint" });
            };
            
            socket.onclose = (event) => {
              console.log("WebSocket connection closed:", event);
              clearTimeout(timeoutId);
              delete activeConnections.current[server.id];
            };
          } catch (error) {
            console.error('Error in WebSocket connection test:', error);
            clearTimeout(timeoutId);
            delete activeConnections.current[server.id];
            resolve({ 
              success: false, 
              message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
            });
          }
        });
        
        const result = await testPromise;
        console.log(`Test result for ${server.url}:`, result);
        
        setTestResults(prev => ({
          ...prev,
          [server.id]: result
        }));
        
        // Update the server status based on the test result
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
    testMCPServer,
    activeConnections: activeConnections.current
  };
};
