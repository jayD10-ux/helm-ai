
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

    // Prepare the request to Gemini
    const requestBody = {
      contents: [
        {
          parts: [
            { text: systemPrompt },
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

    return new Response(
      JSON.stringify({ text: generatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
