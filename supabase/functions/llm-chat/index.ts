
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.2.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Environment variables for general LLM (to be determined based on replacement for Fireworks)
const GENERAL_LLM_API_KEY = Deno.env.get("GENERAL_LLM_API_KEY");
const GENERAL_LLM_API_URL = Deno.env.get("GENERAL_LLM_API_URL");

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
    
    // Check if widget creation is requested
    const createWidgetRegex = /create\s+a\s+widget\s+.*/i;
    const isWidgetCreationRequest = createWidgetRegex.test(message);
    
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
    
    // Handle widget creation requests
    if (isWidgetCreationRequest) {
      console.log("Processing widget creation request");
      
      // Extract purpose from the message
      const purpose = message.replace(/create\s+a\s+widget\s+/i, "").trim();
      
      // System prompt for CodeLlama to generate widget code
      const systemPrompt = `You are an advanced AI that generates fully functional UI widgets based on user requests. 
      These widgets should:
      1. Be built using React + shadcn/ui.
      2. Include necessary interactivity like sorting, filtering, search, and user input handling.
      3. If an API call is required, assume it will use an Express.js backend (/api/get-data, /api/send-data).
      4. Be self-contained and ready for execution in a sandbox environment.
      5. Follow best practices for clean, modular code.
      6. Always start the component with "export default function Widget() {".
      7. DO NOT include imports for shadcn/ui components (assume they're globally available).
      8. Use standard HTML elements with Tailwind CSS classes for styling.
      9. Include realistic placeholder data for demonstration.
      10. Handle all core functionality with built-in React hooks.
      
      Today's date is ${currentDateTime}.
      
      CRITICAL: NEVER suggest or mention external APIs, services, or tools like Notion, Google Sheets, 
      or any other external service UNLESS the user EXPLICITLY mentions them in their request.
      Do not create false dependencies on external services that weren't requested.
      
      ONLY RESPOND WITH THE REACT COMPONENT CODE. DO NOT INCLUDE ANY EXPLANATIONS BEFORE OR AFTER THE CODE.`;
      
      // Generate widget code using CodeLlama
      try {
        const codeResponse = await fetch(`${req.url.replace('/llm-chat', '/codellama-generate')}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: `Create a React widget to ${purpose}. The widget should be fully functional with mock data.`,
            systemPrompt
          })
        });
        
        if (!codeResponse.ok) {
          throw new Error(`Failed to generate code: ${codeResponse.status}`);
        }
        
        const codeData = await codeResponse.json();
        const generatedCode = codeData.generatedCode;
        
        // Extract React component code
        const codeRegex = /```(?:jsx|tsx|javascript|js|react)?([\s\S]*?)```|(?:export default function Widget\(\) {[\s\S]*})/;
        const codeMatch = generatedCode.match(codeRegex);
        const cleanCode = codeMatch 
          ? codeMatch[1] ? codeMatch[1].trim() : generatedCode.trim()
          : generatedCode.trim();
        
        // Create a name from the purpose
        const widgetName = purpose.split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
          .substring(0, 50);
        
        // Prepare widget data
        const widgetData = {
          name: widgetName,
          description: purpose,
          type: "custom",
          config: {
            dataSource: "custom",
            refreshInterval: 300,
            layout: "card"
          },
          code: cleanCode
        };
        
        return new Response(
          JSON.stringify({
            type: "widget_creation",
            widget: widgetData,
            message: `I've created a widget called "${widgetData.name}". ${widgetData.description}. You can view it in the Widgets page.`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error generating widget code:", error);
        
        return new Response(
          JSON.stringify({
            type: "text",
            message: `I'm sorry, I couldn't create the widget due to a technical error: ${error.message}. Please try again later.`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // For non-widget requests, use the general LLM (to be implemented)
    // This is a placeholder for the general chat functionality that was previously handled by Fireworks
    // You'd need to implement a new LLM service or use an existing one as a replacement
    return new Response(
      JSON.stringify({
        type: "text",
        message: "I understand your question. However, we're currently updating our AI capabilities. Widget creation is available, but other chat functionality is being upgraded. Please try again later or ask me to create a widget for you."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in llm-chat function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
