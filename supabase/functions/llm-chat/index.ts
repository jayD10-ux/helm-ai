
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.2.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIREWORKS_API_KEY = Deno.env.get("FIREWORKS_API_KEY");
const FIREWORKS_API_URL = "https://api.fireworks.ai/inference/v1/chat/completions";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, chatId, mcpData } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Received message: "${message}" for chat ${chatId}`);
    console.log(`MCP Data available: ${mcpData ? 'Yes' : 'No'}`);
    
    // Check if API key exists
    if (!FIREWORKS_API_KEY) {
      console.error("Fireworks API key not found in environment variables");
      return new Response(
        JSON.stringify({ error: "API configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if the message is about creating a widget
    const createWidgetRegex = /create\s+a\s+widget\s+.*/i;
    const isWidgetCreationRequest = createWidgetRegex.test(message);
    
    // Check if the query is related to time or date
    const timeRegex = /time|date|day|today|current date|current time|now/i;
    const isTimeRelatedQuery = timeRegex.test(message);
    
    // Get current date and time
    const now = new Date();
    const currentDateTime = now.toLocaleString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    // Prepare the system message based on the type of request
    let systemMessage = `You are Helm AI, a helpful AI assistant. Today's date and time is ${currentDateTime}.`;
    
    // Add MCP capabilities information if available and this is NOT a widget creation request
    if (mcpData && mcpData.length > 0 && !isWidgetCreationRequest) {
      systemMessage += `\n\nYou have access to the following Model Context Protocol (MCP) servers:\n`;
      
      mcpData.forEach((server, index) => {
        systemMessage += `\n${index + 1}. ${server.serverName} with the following capabilities:\n`;
        
        // Add authentication status information
        const authStatus = server.isAuthenticated 
          ? "AUTHENTICATED - You can access user-specific data and perform actions on their behalf" 
          : "NOT AUTHENTICATED - You cannot access user-specific data until they authenticate";
        
        systemMessage += `Authentication Status: ${authStatus}\n`;
        
        if (server.capabilities && server.capabilities.length > 0) {
          // Group capabilities by type
          const toolCapabilities = server.capabilities.filter(cap => cap.type === 'tool');
          const resourceCapabilities = server.capabilities.filter(cap => cap.type === 'resource');
          const promptCapabilities = server.capabilities.filter(cap => cap.type === 'prompt');
          
          if (toolCapabilities.length > 0) {
            systemMessage += "- Tools:\n";
            toolCapabilities.forEach(tool => {
              systemMessage += `  * ${tool.name}: ${tool.description || 'No description available'}\n`;
            });
          }
          
          if (resourceCapabilities.length > 0) {
            systemMessage += "- Resources:\n";
            resourceCapabilities.forEach(resource => {
              systemMessage += `  * ${resource.name}: ${resource.description || 'No description available'}\n`;
            });
          }
          
          if (promptCapabilities.length > 0) {
            systemMessage += "- Prompts:\n";
            promptCapabilities.forEach(prompt => {
              systemMessage += `  * ${prompt.name}: ${prompt.description || 'No description available'}\n`;
            });
          }
        } else {
          systemMessage += "- No specific capabilities detected\n";
        }
      });
      
      // Add guidance on authentication to the system message
      const unauthenticatedServers = mcpData.filter(server => server.requiresAuth && !server.isAuthenticated);
      if (unauthenticatedServers.length > 0) {
        systemMessage += `\n\nIMPORTANT: The following MCP servers require authentication before you can access user-specific data: ${unauthenticatedServers.map(s => s.serverName).join(', ')}. If the user asks about data from these services, inform them they need to authenticate first in the MCP Servers page.`;
      }
      
      systemMessage += `\nWhen the user asks about data that might be available through these MCP servers, you should mention the relevant capabilities and explain how they could be used to retrieve the requested information.`;
      
      // Add guidance on authentication requirements for specific services
      systemMessage += `\nIf a user asks to create or access content on services like Notion, Google Sheets, or other personal accounts, check if the corresponding MCP server is authenticated. If not, inform them they need to authenticate with the service first.`;
    }
    
    if (isWidgetCreationRequest) {
      // For widget creation, use a dedicated system message that focuses on creating React widgets
      // without mentioning MCP servers unless they're specifically relevant to the request
      systemMessage = `You are Helm AI, specialized in creating React widgets using the shadcn/ui component system and Tailwind CSS. Today's date and time is ${currentDateTime}.
      
      When asked to create a widget, you must respond ONLY with a JSON object that includes:
      - name: A concise name for the widget
      - description: A detailed description of what the widget does
      - type: Should be "custom" 
      - config: An object containing relevant configuration options like dataSource, refreshInterval, layout
      - code: A complete, well-formatted React component that implements the requested widget
      
      Your widget code must:
      1. Be a complete React functional component that starts with "export default function Widget() {"
      2. Use Tailwind CSS for styling
      3. Include realistic placeholder data for demonstration
      4. Be fully interactive (sorting, filtering, form inputs, etc.)
      5. Not include imports for shadcn/ui components (assume they're globally available)
      6. Use these common UI components that will be properly styled via CSS:
         - div.card for card containers
         - div.card-header for card headers
         - h3.card-title for card titles
         - p.card-description for card descriptions
         - div.card-content for card content
         - div.card-footer for card footers
         - button.btn.btn-primary for primary buttons
         - input.input for text inputs
         
      The config object should have sensible defaults like refreshInterval: 300 seconds (5 minutes).
      Layout options include "card", "table", "chart", etc.
      
      IMPORTANT: Create the widget based ONLY on the user's request. Do NOT assume any external integration 
      is required unless explicitly mentioned in the user's request. Create a standalone widget that works 
      with mock data by default.
      
      CRITICAL: NEVER suggest or mention external APIs, services, or tools like Notion, Google Sheets, 
      or any other external service UNLESS the user EXPLICITLY mentions them in their request.
      Do not create false dependencies on external services that weren't requested.
      
      When creating a WhatsApp messaging widget, make sure it includes:
      1. A table to display customer information (name, phone, email, etc.)
      2. Functionality to add new customers
      3. Sorting and searching capabilities for the customer table
      4. A message template editor with variables like {{name}}, {{product}}, etc.
      5. Options to send messages manually or automatically
      6. Status indicators for message delivery
      7. All functionality should work with local mock data
      
      Example component structure:
      \`\`\`jsx
      export default function Widget() {
        // State and hooks
        const [data, setData] = React.useState([...mockData]);
        
        // Helper functions
        const handleFilter = () => { /* implementation */ };
        
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Widget Title</h3>
              <p className="card-description">Widget description</p>
            </div>
            <div className="card-content">
              {/* Widget content */}
            </div>
            <div className="card-footer">
              <button className="btn btn-primary">Action</button>
            </div>
          </div>
        );
      }
      \`\`\``;
      
      // Only mention MCP servers as an optional integration if they're available,
      // but make it clear they should only be used if specifically relevant to the request
      if (mcpData && mcpData.length > 0) {
        systemMessage += `\n\nOPTIONAL: If the user's widget request SPECIFICALLY mentions data from services 
        like ${mcpData.map(s => s.serverName).join(', ')}, you MAY suggest using these connections. 
        However, by default, create a standalone widget using mock data that does not require any external API.`;
      }
    }
    
    // For time-related queries, emphasize the current date/time
    if (isTimeRelatedQuery) {
      systemMessage += ` It is very important that you provide accurate current date and time information: ${currentDateTime}.`;
    }
    
    console.log(`Using system message: ${systemMessage}`);
    
    // Call the Fireworks AI API
    const response = await fetch(FIREWORKS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIREWORKS_API_KEY}`,
      },
      body: JSON.stringify({
        model: "accounts/fireworks/models/mixtral-8x7b-instruct",
        messages: [
          {
            role: "system",
            content: systemMessage
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fireworks API error:", errorText);
      throw new Error(`Fireworks API error: ${response.status} ${errorText}`);
    }
    
    const fireworksResponse = await response.json();
    console.log("Fireworks API response:", JSON.stringify(fireworksResponse));
    
    const assistantMessage = fireworksResponse.choices[0]?.message?.content || "";
    
    // Process the response based on the request type
    if (isWidgetCreationRequest) {
      try {
        // Try to extract JSON from the response - it might be embedded in text
        const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : null;
        
        if (jsonStr) {
          // Parse the JSON widget definition
          const widgetData = JSON.parse(jsonStr);
          
          // Validate the widget data
          if (widgetData.name && widgetData.description && widgetData.code) {
            console.log("Widget code generated successfully");
            
            // Create sandbox in CodeSandbox
            try {
              const sandboxResponse = await fetch("https://nwaeufzdrvwfavohsklz.functions.supabase.co/widget-sandbox", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  code: widgetData.code
                })
              });
              
              if (!sandboxResponse.ok) {
                throw new Error(`Failed to create sandbox: ${sandboxResponse.status}`);
              }
              
              const sandboxData = await sandboxResponse.json();
              console.log("Sandbox created:", JSON.stringify(sandboxData));
              
              // Add sandbox data to widget
              widgetData.sandboxId = sandboxData.sandboxId;
              widgetData.previewUrl = sandboxData.previewUrl;
              
              return new Response(
                JSON.stringify({
                  type: "widget_creation",
                  widget: widgetData,
                  message: `I've created a widget called "${widgetData.name}". ${widgetData.description}`
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            } catch (sandboxError) {
              console.error("Error creating sandbox:", sandboxError);
              
              // Return the widget without sandbox data
              return new Response(
                JSON.stringify({
                  type: "widget_creation",
                  widget: widgetData,
                  message: `I've created a widget called "${widgetData.name}". ${widgetData.description}`
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
        }
        
        // Fallback if we couldn't parse JSON or validate widget data
        // Extract the purpose from the original message
        const purpose = message.replace(/create\s+a\s+widget\s+/i, "").trim();
        
        return new Response(
          JSON.stringify({
            type: "widget_creation",
            widget: {
              name: `${purpose.split(" ").slice(0, 3).join(" ")} Widget`,
              description: purpose,
              type: "custom",
              config: {
                dataSource: purpose.includes("gmail") ? "gmail" : 
                           purpose.includes("slack") ? "slack" : "custom",
                refreshInterval: 300,
                layout: "card"
              },
              code: `export default function Widget() {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">${purpose.split(" ").slice(0, 3).join(" ")} Widget</h3>
        <p className="card-description">${purpose}</p>
      </div>
      <div className="card-content">
        <p>This widget was created to ${purpose}.</p>
      </div>
      <div className="card-footer">
        <button className="btn btn-primary">Refresh</button>
      </div>
    </div>
  );
}`
            },
            message: `I've created a widget to ${purpose}. You can find it in your widgets dashboard.`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error processing widget creation:", error);
        // Return a fallback widget if JSON parsing fails
        const purpose = message.replace(/create\s+a\s+widget\s+/i, "").trim();
        
        return new Response(
          JSON.stringify({
            type: "widget_creation",
            widget: {
              name: `${purpose.split(" ").slice(0, 3).join(" ")} Widget`,
              description: purpose,
              type: "custom",
              config: {
                dataSource: "custom",
                refreshInterval: 300,
                layout: "card"
              },
              code: `export default function Widget() {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">${purpose.split(" ").slice(0, 3).join(" ")} Widget</h3>
        <p className="card-description">${purpose}</p>
      </div>
      <div className="card-content">
        <p>This widget was created to ${purpose}.</p>
      </div>
      <div className="card-footer">
        <button className="btn btn-primary">Refresh</button>
      </div>
    </div>
  );
}`
            },
            message: `I've created a widget to ${purpose}. You can find it in your widgets dashboard.`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // For regular chat messages, return the LLM response directly
      return new Response(
        JSON.stringify({
          type: "text",
          message: assistantMessage
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in llm-chat function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
