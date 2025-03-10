import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { testMCPConnection, checkOAuthRequired, initiateOAuth } from "@/services/composio";

export interface MCPServer {
  id: string;
  url: string;
  name: string;
  connectionType: "sse" | "websocket";
  status: "connected" | "disconnected" | "pending";
  requiresAuth?: boolean;
  isAuthenticated?: boolean;
}

// For development without authentication
const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

export const useMCPServers = () => {
  const { toast } = useToast();
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  
  // Store active connections to clean up when needed
  const activeConnections = useRef<Record<string, EventSource | WebSocket>>({});

  useEffect(() => {
    loadMCPServers();
    
    // Set up OAuth callback listener
    const handleOAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const serverId = urlParams.get('server_id');
      
      if (code && state) {
        processOAuthCallback(code, state, serverId || undefined);
      }
    };
    
    // Check if current URL is an OAuth callback
    if (window.location.pathname.includes('oauth-callback')) {
      handleOAuthCallback();
    }
    
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

  const processOAuthCallback = async (code: string, state: string, serverId?: string) => {
    try {
      setLoading(true);
      
      // Import this function dynamically to avoid circular dependencies
      const { handleOAuthCallback } = await import('@/services/composio');
      const success = await handleOAuthCallback(code, state, serverId);
      
      if (success && serverId) {
        // Update the server's authentication status
        const updatedServers = mcpServers.map(server => 
          server.id === serverId 
            ? { ...server, isAuthenticated: true } 
            : server
        );
        
        await saveMCPServers(updatedServers);
        
        toast({
          title: "Authentication Successful",
          description: "Successfully authenticated with the MCP server.",
        });
        
        // Close the OAuth popup if it exists
        window.close();
      } else {
        toast({
          title: "Authentication Failed",
          description: "Failed to complete authentication with the MCP server.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing OAuth callback:', error);
      toast({
        title: "Authentication Error",
        description: "An error occurred during authentication.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
        status: "pending", // Explicitly set as one of the allowed values
        requiresAuth: undefined,
        isAuthenticated: undefined
      };
      
      const updatedServers = [...mcpServers, newServer];
      const saveSuccess = await saveMCPServers(updatedServers);
      
      if (saveSuccess) {
        toast({
          title: "MCP Server Added",
          description: `${suggestedName} has been added successfully.`,
        });
        
        // Automatically test the connection using Composio
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

      console.log(`Testing connection to MCP server: ${server.url} using Composio`);

      // First, check if this server requires OAuth authentication
      const requiresAuth = await checkOAuthRequired(server);
      
      console.log(`Server ${server.url} requires authentication: ${requiresAuth}`);
      
      // Update the server to indicate if it requires authentication
      const updatedServer = { 
        ...server, 
        requiresAuth 
      };
      
      // Save this information
      const updatedServers = mcpServers.map(s => 
        s.id === server.id ? updatedServer : s
      );
      await saveMCPServers(updatedServers);
      
      if (requiresAuth && !server.isAuthenticated) {
        // If authentication is required but not yet authenticated
        return {
          success: false,
          message: "Authentication required. Please authenticate to connect."
        };
      }
      
      // Use the Composio service to test the connection
      const result = await testMCPConnection(server.url);
      
      console.log(`Test result for ${server.url}:`, result);
      
      setTestResults(prev => ({
        ...prev,
        [server.id]: result
      }));
      
      // Update the server status based on the test result
      const newStatus = result.success ? "connected" as const : "disconnected" as const;
      
      const serversWithUpdatedStatus = updatedServers.map(s => 
        s.id === server.id 
          ? { ...s, status: newStatus } 
          : s
      );
      
      saveMCPServers(serversWithUpdatedStatus);
      
      return result;
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
  
  const authenticateMCPServer = async (server: MCPServer) => {
    try {
      setLoading(true);
      
      // First, ensure we know if this server requires authentication
      if (server.requiresAuth === undefined) {
        const requiresAuth = await checkOAuthRequired(server);
        server = { ...server, requiresAuth };
        
        // Update the server in our state
        const updatedServers = mcpServers.map(s => 
          s.id === server.id ? server : s
        );
        await saveMCPServers(updatedServers);
      }
      
      if (!server.requiresAuth) {
        toast({
          title: "Authentication Not Required",
          description: "This MCP server doesn't require authentication.",
        });
        return false;
      }
      
      // Initiate the OAuth flow
      const success = await initiateOAuth(server);
      
      if (!success) {
        toast({
          title: "Authentication Failed",
          description: "Failed to initiate authentication with the MCP server.",
          variant: "destructive"
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error authenticating with MCP server:', error);
      toast({
        title: "Authentication Error",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
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
    authenticateMCPServer,
    activeConnections: activeConnections.current
  };
};
