
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.2.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Since we don't have a Fireworks API key in the secrets yet,
// we'll use a mock LLM response for testing
function mockLLMResponse(input: string) {
  console.log("Processing input with mock LLM:", input);
  
  // Check if the message is about creating a widget
  const createWidgetRegex = /create\s+a\s+widget\s+.*/i;
  if (createWidgetRegex.test(input)) {
    // Extract the purpose of the widget from the input
    const purpose = input.replace(/create\s+a\s+widget\s+/i, "").trim();
    
    // Mock response for widget creation
    return {
      type: "widget_creation",
      widget: {
        name: `${purpose.split(" ").slice(0, 3).join(" ")} Widget`,
        description: purpose,
        type: "custom",
        config: {
          dataSource: purpose.includes("gmail") ? "gmail" : 
                     purpose.includes("slack") ? "slack" : "custom",
          refreshInterval: 300, // 5 minutes in seconds
          layout: "card"
        }
      },
      message: `I've created a widget to ${purpose}. You can find it in your widgets dashboard.`
    };
  }
  
  // Default response for other messages
  return {
    type: "text",
    message: `I'm your AI assistant. I can help you create widgets for different purposes. Try asking me to "Create a widget that shows weather forecasts" or "Create a widget that displays my recent emails".`
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, chatId } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Received message: "${message}" for chat ${chatId}`);
    
    // In a production environment, this would call an actual LLM API
    // For now, we'll use our mock function
    const llmResponse = mockLLMResponse(message);
    
    // Return the LLM response
    return new Response(
      JSON.stringify(llmResponse),
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
