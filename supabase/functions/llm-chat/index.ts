
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
    const { message, chatId } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Received message: "${message}" for chat ${chatId}`);
    
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
    
    if (isWidgetCreationRequest) {
      systemMessage = `You are Helm AI, specialized in creating data widgets. Today's date and time is ${currentDateTime}.
      When asked to create a widget, respond with a JSON object that includes: 
      - name: A concise name for the widget
      - description: A detailed description of what the widget does
      - type: Should be "custom" 
      - config: An object containing relevant configuration options like dataSource, refreshInterval, layout
      
      The config object should have sensible defaults. Common dataSources include "gmail", "slack", "weather", "stocks", etc.
      A typical refreshInterval is 300 seconds (5 minutes).
      Layout options include "card", "table", "chart", etc.`;
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
        max_tokens: 800
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
          if (widgetData.name && widgetData.description) {
            return new Response(
              JSON.stringify({
                type: "widget_creation",
                widget: {
                  name: widgetData.name,
                  description: widgetData.description,
                  type: widgetData.type || "custom",
                  config: widgetData.config || {
                    dataSource: "custom",
                    refreshInterval: 300,
                    layout: "card"
                  }
                },
                message: `I've created a widget called "${widgetData.name}". ${widgetData.description}`
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
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
              }
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
              }
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
