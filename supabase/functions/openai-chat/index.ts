
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.2.1/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if API key is configured
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({ 
          error: "API key not configured",
          text: "I'm having trouble connecting to OpenAI right now. The API key is not configured.",
          status: 500
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request received:", JSON.stringify({
        isWidgetRequest: requestBody.isWidgetRequest,
        contentLength: requestBody.content?.length || 0,
        debugMode: requestBody.debugMode || false
      }));
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request format",
          text: "I'm having trouble processing your request. Please try again.",
          status: 400
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { content, isWidgetRequest, systemPrompt, debugMode, modelType } = requestBody;
    
    if (!content) {
      console.error("Missing 'content' in request");
      return new Response(
        JSON.stringify({ 
          error: "Missing content in request",
          text: "I couldn't process your request. Please provide a message.",
          status: 400
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the current date for context
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    let effectiveSystemPrompt = systemPrompt || "";
    
    // Add current date context to all prompts
    effectiveSystemPrompt = `Today is ${currentDate}. ${effectiveSystemPrompt}`;
    
    // Default to gpt-4o-mini if not specified
    const model = modelType || "gpt-4o-mini";
    
    // If this is a widget creation request, use a specialized system prompt
    if (isWidgetRequest) {
      effectiveSystemPrompt = `
Today is ${currentDate}.

### Objective:
You are an advanced AI that generates fully functional UI widgets based on user requests. These widgets should:
1. Be built using **React + shadcn/ui**.
2. Include necessary interactivity like sorting, filtering, search, and user input handling.
3. If an API call is required, assume it will use an Express.js backend (/api/get-data, /api/send-data).
4. Be **self-contained** and **ready for execution in a sandbox environment**.
5. Follow best practices for clean, modular code.

#### Response Format:
Provide your response in this exact JSON format:
{
  "type": "widget_creation",
  "widget": {
    "name": "Widget Name",
    "description": "Brief description of widget functionality",
    "type": "dashboard",
    "config": {}
  },
  "message": "Explanation of what you've created"
}

DO NOT include a 'code' field in the widget object. The code will be provided separately.
`;
    }

    // Prepare the request to OpenAI
    const requestBodyForOpenAI = {
      model: model,
      messages: [
        { role: "system", content: effectiveSystemPrompt },
        { role: "user", content: content }
      ],
      temperature: isWidgetRequest ? 0.2 : 0.7, // Lower temperature for widget creation
      max_tokens: 4096
    };

    console.log("Sending request to OpenAI API");
    if (debugMode) {
      console.log("Request to OpenAI:", JSON.stringify(requestBodyForOpenAI));
    }
    
    // Make the request to OpenAI API
    let response;
    try {
      response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBodyForOpenAI)
      });
      
      console.log("OpenAI API response status:", response.status);
    } catch (fetchError) {
      console.error("Network error when calling OpenAI API:", fetchError);
      return new Response(
        JSON.stringify({ 
          error: `Network error: ${fetchError.message}`,
          text: "I'm having trouble connecting to OpenAI right now. Please try again in a moment.",
          status: 500
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the response from OpenAI
    let data;
    try {
      data = await response.json();
      console.log("Received response from OpenAI API with status:", response.status);
      if (debugMode) {
        console.log("OpenAI API response:", JSON.stringify(data).substring(0, 500) + "...");
      }
    } catch (jsonError) {
      console.error("Error parsing OpenAI API response:", jsonError);
      return new Response(
        JSON.stringify({ 
          error: `Error parsing response: ${jsonError.message}`,
          text: "I received an invalid response from OpenAI. Please try again.",
          status: 500
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check for errors in the response
    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error: ${JSON.stringify(data)}`,
          text: "OpenAI API returned an error. Please try again later.",
          details: data,
          status: response.status
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!data.choices || data.choices.length === 0) {
      console.error("No choices returned from OpenAI API:", data);
      return new Response(
        JSON.stringify({ 
          error: "No response generated from OpenAI API",
          text: "I couldn't generate a response. Please try again with a different request.",
          details: data,
          status: 500
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const generatedText = data.choices[0]?.message?.content;
    if (!generatedText) {
      console.error("Invalid response structure from OpenAI API:", data);
      return new Response(
        JSON.stringify({ 
          error: "Invalid response structure from OpenAI API",
          text: "I received an unexpected response format. Please try again.",
          details: data,
          status: 500
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log("Generated text length:", generatedText.length);

    // Process the response based on the request type
    if (isWidgetRequest) {
      try {
        // Try to extract JSON from the response
        // First, try direct JSON parsing
        let widgetData;
        let jsonParsingError = null;
        
        try {
          // Check if the entire response is valid JSON
          widgetData = JSON.parse(generatedText);
          console.log("Successfully parsed entire response as JSON");
        } catch (directParseError) {
          jsonParsingError = directParseError;
          console.log("Direct JSON parsing failed, trying regex extraction");
          
          // If direct parsing fails, try to extract JSON using regex patterns
          const patterns = [
            /```json\s*([\s\S]*?)\s*```/, // JSON in code blocks
            /({[\s\S]*})/, // Any JSON-like structure
            /{[\s\S]*?"type"\s*:\s*"widget_creation"[\s\S]*?}/i // Specific widget JSON
          ];
          
          for (const pattern of patterns) {
            const jsonMatch = generatedText.match(pattern);
            if (jsonMatch && jsonMatch[1]) {
              try {
                widgetData = JSON.parse(jsonMatch[1]);
                console.log("Successfully extracted JSON with pattern:", pattern);
                jsonParsingError = null;
                break;
              } catch (extractError) {
                console.error("Failed to parse extracted JSON with pattern:", pattern, extractError);
              }
            }
          }
        }
        
        if (jsonParsingError) {
          console.error("All JSON parsing attempts failed:", jsonParsingError);
        }

        if (widgetData && (widgetData.widget || widgetData.type === "widget_creation")) {
          // Handle nested widget structure if needed
          const finalWidgetData = widgetData.widget || widgetData;
          console.log("Successfully processed widget data");
          
          // Remove the code property if it exists (since the database doesn't have this column)
          if (finalWidgetData.code) {
            console.log("Removing code property from widget data for database compatibility");
            const { code, ...widgetDataWithoutCode } = finalWidgetData;
            
            return new Response(
              JSON.stringify({
                text: widgetData.message || "Widget created successfully",
                type: "widget_creation",
                widget: {
                  ...widgetDataWithoutCode,
                  // Store code separately if needed
                  code: code
                },
                message: widgetData.message || "Here's your widget!"
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            return new Response(
              JSON.stringify({
                text: widgetData.message || "Widget created successfully",
                type: "widget_creation",
                widget: finalWidgetData,
                message: widgetData.message || "Here's your widget!"
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          // If JSON parsing fails, return the raw text
          console.log("Could not parse widget JSON, returning raw text");
          return new Response(
            JSON.stringify({ 
              text: generatedText,
              error: "Failed to parse widget data",
              rawOutput: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (error) {
        console.error("Error processing widget response:", error);
        return new Response(
          JSON.stringify({ 
            text: generatedText,
            error: `Error processing widget data: ${error.message}`,
            rawOutput: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // For regular chat responses, return the text directly
      return new Response(
        JSON.stringify({ text: generatedText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Unhandled error in OpenAI chat function:", error);
    return new Response(
      JSON.stringify({ 
        error: `Unhandled error: ${error.message}`,
        text: "An unexpected error occurred. Please try again.",
        status: 500
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
