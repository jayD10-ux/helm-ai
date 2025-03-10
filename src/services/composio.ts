
import composio from 'composio';

// Initialize Composio client with the API key
const composioClient = composio({
  apiKey: 'a27jq6q5drcpfzeacg56r'
});

export const connectToMCP = async (url: string): Promise<boolean> => {
  try {
    console.log(`Connecting to MCP server at: ${url}`);
    
    // Use Composio to connect to the MCP server
    const connection = await composioClient.connect(url);
    
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
        message: "Successfully connected to MCP server using Composio"
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

export default composioClient;
