// Import the composio-core module
import * as composioCore from 'composio-core';
import { MCPServer } from '@/hooks/use-mcp-servers';
import { MCPCapability } from '@/components/mcps/MCPServerCapabilities';

// Create a client that handles MCP connections
const composioClient = {
  // OAuth-related properties to track authentication state
  oauthState: new Map<string, string>(),
  oauthWindows: new Map<string, Window>(),
  
  connectMCPServer: async (url: string) => {
    console.log(`Attempting to connect to MCP server at: ${url}`);
    try {
      // For this POC implementation, we'll simulate a successful connection
      // In a real implementation, we would use the composio-core library to establish a connection
      
      // Here's how we might implement it with the real library:
      // const mcpClient = new composioCore.McpClient();
      // await mcpClient.connect(url);
      
      return { status: 'connected' };
    } catch (error) {
      console.error('Unexpected error in connectMCPServer:', error);
      return { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }
  },
  
  // Fetch the capabilities of an MCP server
  fetchServerCapabilities: async (server: MCPServer): Promise<MCPCapability[]> => {
    try {
      console.log(`Fetching capabilities for MCP server: ${server.url}`);
      
      // In a real implementation, we would query the server for its capabilities
      // For this POC, we'll return mock capabilities based on the server URL
      
      // Generate deterministic capabilities based on server URL
      const hash = Array.from(server.url).reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      // Mock capabilities list
      const mockCapabilities: MCPCapability[] = [];
      
      // Add tools (3-7 based on URL hash)
      const numTools = 3 + (hash % 5);
      for (let i = 0; i < numTools; i++) {
        mockCapabilities.push({
          type: 'tool',
          name: getToolName(i, hash),
          description: getToolDescription(i, hash),
          category: getToolCategory(i, hash)
        });
      }
      
      // Add resources (1-4 based on URL hash)
      const numResources = 1 + (hash % 4);
      for (let i = 0; i < numResources; i++) {
        mockCapabilities.push({
          type: 'resource',
          name: getResourceName(i, hash),
          description: getResourceDescription(i, hash),
          category: getResourceCategory(i, hash)
        });
      }
      
      // Add prompts (0-3 based on URL hash)
      const numPrompts = hash % 4;
      for (let i = 0; i < numPrompts; i++) {
        mockCapabilities.push({
          type: 'prompt',
          name: getPromptName(i, hash),
          description: getPromptDescription(i, hash)
        });
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 700));
      
      return mockCapabilities;
    } catch (error) {
      console.error('Error fetching MCP server capabilities:', error);
      throw new Error(`Failed to fetch server capabilities: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
  
  // Detect if a server requires OAuth authentication
  requiresOAuth: async (server: MCPServer): Promise<boolean> => {
    try {
      console.log(`Checking if ${server.url} requires OAuth authentication`);
      
      // For this POC, we'll use a simple heuristic
      // Websites with 'auth' or 'oauth' in the URL require authentication
      const requiresAuth = server.url.toLowerCase().includes('auth') || 
                         server.url.toLowerCase().includes('oauth');
                         
      return requiresAuth;
    } catch (error) {
      console.error('Error checking OAuth requirements:', error);
      return false;
    }
  },
  
  // Initiate OAuth authentication flow
  initiateOAuth: async (server: MCPServer): Promise<{ authUrl: string; state: string }> => {
    try {
      console.log(`Initiating OAuth flow for ${server.url}`);
      
      // Generate a random state parameter for security
      const state = Math.random().toString(36).substring(2, 15);
      composioClient.oauthState.set(server.id, state);
      
      // Construct a mock OAuth URL
      const authUrl = new URL(`${server.url}/oauth/authorize`);
      authUrl.searchParams.append('client_id', 'helm-ai-client');
      authUrl.searchParams.append('redirect_uri', `${window.location.origin}/oauth-callback`);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('scope', 'read write');
      
      // Add server ID and name for better UX in the callback page
      authUrl.searchParams.append('server_id', server.id);
      authUrl.searchParams.append('server_name', server.name);
      
      console.log(`Auth URL: ${authUrl.toString()}`);
      
      return { authUrl: authUrl.toString(), state };
    } catch (error) {
      console.error('Error initiating OAuth flow:', error);
      throw new Error(`Failed to initiate OAuth flow: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
  
  // Open OAuth authentication window
  openOAuthWindow: (server: MCPServer, authUrl: string): Window | null => {
    try {
      console.log(`Opening OAuth window for ${server.url}`);
      
      // Close any existing OAuth window for this server
      if (composioClient.oauthWindows.has(server.id)) {
        const existingWindow = composioClient.oauthWindows.get(server.id);
        if (existingWindow && !existingWindow.closed) {
          existingWindow.close();
        }
      }
      
      // Open a new window for OAuth authentication
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const oauthWindow = window.open(
        authUrl,
        `oauth-${server.id}`,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
      
      if (oauthWindow) {
        composioClient.oauthWindows.set(server.id, oauthWindow);
      } else {
        console.error('Failed to open OAuth window. Popup might be blocked.');
      }
      
      return oauthWindow;
    } catch (error) {
      console.error('Error opening OAuth window:', error);
      return null;
    }
  },
  
  // Handle OAuth callback with authorization code
  handleOAuthCallback: async (code: string, state: string, serverId?: string): Promise<boolean> => {
    try {
      console.log(`Handling OAuth callback with code: ${code} and state: ${state}`);
      
      // Verify the state parameter to prevent CSRF attacks
      let validServer: string | undefined = serverId;
      
      if (!validServer) {
        // Find the server that initiated this OAuth flow
        for (const [id, savedState] of composioClient.oauthState.entries()) {
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
      
      console.log(`Valid OAuth callback for server: ${validServer}`);
      
      // In a real implementation, this would exchange the code for an access token
      // For this POC, we'll simulate a successful token exchange
      console.log(`Exchanging code for access token...`);
      
      // Simulate token exchange delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Successfully authenticated with server ${validServer}`);
      return true;
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return false;
    }
  }
};

// Helper functions for generating mock capabilities
function getToolName(index: number, hash: number): string {
  const toolNames = [
    'Data Query', 'File Search', 'Code Generator', 'Image Processor',
    'Text Analyzer', 'API Connector', 'Database Access', 'Translation',
    'Document Parser', 'Content Summarizer', 'Chart Generator', 'Calculator'
  ];
  return toolNames[(index + hash) % toolNames.length];
}

function getToolDescription(index: number, hash: number): string {
  const descriptions = [
    'Queries data from various sources',
    'Searches for files matching specific criteria',
    'Generates code snippets based on descriptions',
    'Processes and analyzes images',
    'Analyzes text for sentiment, entities, and more',
    'Connects to external APIs',
    'Provides access to databases',
    'Translates content between languages',
    'Extracts information from documents',
    'Summarizes long-form content',
    'Generates charts and visualizations',
    'Performs complex calculations'
  ];
  return descriptions[(index + hash) % descriptions.length];
}

function getToolCategory(index: number, hash: number): string {
  const categories = ['Data', 'Files', 'Code', 'Media', 'Text', 'Integration', 'Utility'];
  return categories[(index + hash) % categories.length];
}

function getResourceName(index: number, hash: number): string {
  const resourceNames = [
    'Document Repository', 'Image Library', 'Data Store', 'Code Snippets',
    'API Endpoints', 'User Profiles', 'Content Library', 'Knowledge Base'
  ];
  return resourceNames[(index + hash) % resourceNames.length];
}

function getResourceDescription(index: number, hash: number): string {
  const descriptions = [
    'Collection of documents',
    'Library of images',
    'Store of structured data',
    'Repository of code snippets',
    'Endpoints for API access',
    'User profile information',
    'Library of content',
    'Base of knowledge'
  ];
  return descriptions[(index + hash) % descriptions.length];
}

function getResourceCategory(index: number, hash: number): string {
  const categories = ['Content', 'Media', 'Data', 'Code', 'API', 'User', 'Knowledge'];
  return categories[(index + hash) % categories.length];
}

function getPromptName(index: number, hash: number): string {
  const promptNames = [
    'Content Generator', 'Question Answering', 'Code Explanation',
    'Document Analysis', 'Creative Writing', 'Problem Solving'
  ];
  return promptNames[(index + hash) % promptNames.length];
}

function getPromptDescription(index: number, hash: number): string {
  const descriptions = [
    'Generates content based on prompts',
    'Answers questions based on provided context',
    'Explains code snippets',
    'Analyzes documents and extracts information',
    'Assists with creative writing',
    'Helps solve problems'
  ];
  return descriptions[(index + hash) % descriptions.length];
}

// Public API
export const connectToMCP = async (url: string): Promise<boolean> => {
  try {
    console.log(`Connecting to MCP server at: ${url}`);
    
    // Use our client to connect to the MCP server
    const connection = await composioClient.connectMCPServer(url);
    
    console.log('MCP connection result:', connection);
    return connection.status === 'connected';
  } catch (error) {
    console.error('Error connecting to MCP server:', error);
    return false;
  }
};

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

// Function to fetch MCP server capabilities
export const fetchMCPCapabilities = async (server: MCPServer): Promise<MCPCapability[]> => {
  return composioClient.fetchServerCapabilities(server);
};

// OAuth-related exports
export const checkOAuthRequired = async (server: MCPServer): Promise<boolean> => {
  return composioClient.requiresOAuth(server);
};

export const initiateOAuth = async (server: MCPServer): Promise<boolean> => {
  try {
    const { authUrl } = await composioClient.initiateOAuth(server);
    const oauthWindow = composioClient.openOAuthWindow(server, authUrl);
    return !!oauthWindow;
  } catch (error) {
    console.error('Error initiating OAuth:', error);
    return false;
  }
};

export const handleOAuthCallback = async (code: string, state: string, serverId?: string): Promise<boolean> => {
  return composioClient.handleOAuthCallback(code, state, serverId);
};

export default composioClient;
