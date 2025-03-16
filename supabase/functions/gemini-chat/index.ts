
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set");
    return new Response(
      JSON.stringify({ error: "API key not configured" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { content, isWidgetRequest, systemPrompt } = await req.json();
    console.log(`Received request: isWidgetRequest=${isWidgetRequest}`);

    let effectiveSystemPrompt = systemPrompt || "";
    
    // If this is a widget creation request, use a specialized system prompt
    if (isWidgetRequest) {
      effectiveSystemPrompt = `
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
  "widget": {
    "name": "Widget Name",
    "description": "Brief description of widget functionality",
    "type": "dashboard",
    "config": {},
    "code": "// Complete React component code here"
  },
  "message": "Explanation of what you've created"
}
`;
    }

    // Prepare the request to Gemini
    const requestBody = {
      contents: [
        {
          parts: [
            { text: effectiveSystemPrompt },
            { text: content }
          ]
        }
      ],
      generationConfig: {
        temperature: isWidgetRequest ? 0.2 : 0.7, // Lower temperature for widget creation
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
      }
    };

    console.log("Sending request to Gemini API");
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log("Received response from Gemini API");

    if (!response.ok) {
      console.error("Gemini API error:", data);
      throw new Error(`Gemini API error: ${JSON.stringify(data)}`);
    }

    if (!data.candidates || data.candidates.length === 0) {
      console.error("No candidates returned from Gemini API");
      throw new Error("No response generated from Gemini API");
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log("Generated text length:", generatedText.length);

    // Process the response based on the request type
    if (isWidgetRequest) {
      try {
        // Try to extract JSON from the response
        // First, try direct JSON parsing
        let widgetData;
        try {
          // Check if the entire response is valid JSON
          widgetData = JSON.parse(generatedText);
        } catch (e) {
          // If not, try to extract JSON using regex
          const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              widgetData = JSON.parse(jsonMatch[1]);
            } catch (jsonError) {
              console.error("Failed to parse extracted JSON:", jsonError);
            }
          }
        }

        if (widgetData && widgetData.widget) {
          console.log("Successfully parsed widget data");
          return new Response(
            JSON.stringify({
              text: "Widget created successfully",
              type: "widget_creation",
              widget: widgetData.widget,
              message: widgetData.message || "Here's your widget!"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // If JSON parsing fails, return the raw text
          console.log("Could not parse widget JSON, returning raw text");
          return new Response(
            JSON.stringify({ 
              text: generatedText,
              error: "Failed to parse widget data"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (error) {
        console.error("Error processing widget response:", error);
        return new Response(
          JSON.stringify({ 
            text: generatedText,
            error: "Error processing widget data"
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
    console.error("Error in Gemini chat function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
