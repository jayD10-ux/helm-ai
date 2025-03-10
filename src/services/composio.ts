
import { OpenAI } from "openai";
import { OpenAIToolSet } from "composio-core";
import { MCPServer } from '@/hooks/use-mcp-servers';

// Initialize the clients
const openaiClient = new OpenAI();
const composioToolset = new OpenAIToolSet();

// Keep track of OAuth state and windows
const oauthState = new Map<string, string>();
const oauthWindows = new Map<string, Window>();

// Store authentication tokens for MCP servers
const authTokens = new Map<string, { code: string; state: string }>();

// Connect to an MCP server
export const connectToMCP = async (url: string): Promise<boolean> => {
  try {
    console.log(`Connecting to MCP server at: ${url}`);
    
    // Attempt to get tools for this MCP server
    const tools = await composioToolset.getTools({
      apps: [url], // Pass the MCP server URL as an app
    });
    
    console.log('Successfully connected to MCP server with tools:', tools);
    return true;
  } catch (error) {
    console.error('Error connecting to MCP server:', error);
    return false;
  }
};

// Test connection to an MCP server
export const testMCPConnection = async (url: string): Promise<{ 
  success: boolean; 
  message: string;
}> => {
  try {
    const isConnected = await connectToMCP(url);
    
    if (isConnected) {
      return {
        success: true,
        message: "Successfully connected to MCP server"
      };
    } else {
      return {
        success: false,
        message: "Failed to connect to MCP server"
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Check if a server requires OAuth authentication
export const checkOAuthRequired = async (server: MCPServer): Promise<boolean> => {
  try {
    console.log(`Checking if ${server.url} requires OAuth authentication`);
    
    // Try to fetch tools without authentication
    try {
      await composioToolset.getTools({
        apps: [server.url],
      });
      
      // If successful without error, no authentication is required
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if the error message indicates authentication is required
      return errorMessage.toLowerCase().includes('authentication required') ||
             errorMessage.toLowerCase().includes('unauthorized') ||
             errorMessage.toLowerCase().includes('auth');
    }
  } catch (error) {
    console.error('Error checking OAuth requirements:', error);
    return false;
  }
};

// Initiate OAuth authentication flow
export const initiateOAuth = async (server: MCPServer): Promise<boolean> => {
  try {
    console.log(`Initiating OAuth flow for ${server.url}`);
    
    // Generate a random state parameter for security
    const state = Math.random().toString(36).substring(2, 15);
    oauthState.set(server.id, state);
    
    // Construct the auth URL using the MCP server's oauth endpoint
    const authUrl = new URL(`${server.url}/oauth/authorize`);
    authUrl.searchParams.append('client_id', 'helm-ai-client');
    authUrl.searchParams.append('redirect_uri', `${window.location.origin}/oauth-callback`);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('server_id', server.id);
    
    // Open the OAuth window
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const oauthWindow = window.open(
      authUrl.toString(),
      `oauth-${server.id}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    if (oauthWindow) {
      oauthWindows.set(server.id, oauthWindow);
      return true;
    }
    
    console.error('Failed to open OAuth window. Popup might be blocked.');
    return false;
  } catch (error) {
    console.error('Error initiating OAuth:', error);
    return false;
  }
};

// Handle OAuth callback
export const handleOAuthCallback = async (code: string, state: string, serverId?: string): Promise<boolean> => {
  try {
    console.log(`Handling OAuth callback for server ID: ${serverId}`);
    
    // Verify state parameter
    let validServer: string | undefined = serverId;
    if (!validServer) {
      for (const [id, savedState] of oauthState.entries()) {
        if (savedState === state) {
          validServer = id;
          break;
        }
      }
    }
    
    if (!validServer) {
      console.error('Invalid OAuth state parameter');
      return false;
    }
    
    // Store the authentication tokens for future use
    authTokens.set(validServer, { code, state });
    
    console.log(`Successfully stored authentication for server ${validServer}`);
    return true;
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return false;
  }
};

// Get tools from an authenticated MCP server
export const getToolsWithAuth = async (server: MCPServer): Promise<any> => {
  try {
    console.log(`Getting tools for ${server.url} with authentication`);
    
    // Get the authentication tokens for this server
    const auth = authTokens.get(server.id);
    
    if (!auth) {
      console.error('No authentication tokens found for this server');
      throw new Error('Authentication required');
    }
    
    // Create a URL with authentication parameters
    const url = new URL(server.url);
    url.searchParams.append('code', auth.code);
    url.searchParams.append('state', auth.state);
    
    // Use the URL with auth params in the getTools call
    const tools = await composioToolset.getTools({
      apps: [url.toString()]
    });
    
    console.log('Successfully got tools with authentication:', tools);
    return tools;
  } catch (error) {
    console.error('Error getting tools with authentication:', error);
    throw error;
  }
};

export default {
  connectToMCP,
  testMCPConnection,
  checkOAuthRequired,
  initiateOAuth,
  handleOAuthCallback,
  getToolsWithAuth,
};
