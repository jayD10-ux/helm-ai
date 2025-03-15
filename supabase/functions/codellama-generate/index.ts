
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.2.1/mod.ts";

const CODELLAMA_API_KEY = Deno.env.get("CODELLAMA_API_KEY");
const CODELLAMA_API_URL = Deno.env.get("CODELLAMA_API_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, systemPrompt } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating code with prompt: "${prompt.substring(0, 100)}..."`);
    
    // Check if API key and URL exist
    if (!CODELLAMA_API_KEY || !CODELLAMA_API_URL) {
      console.error("CodeLlama API key or URL not found in environment variables");
      return new Response(
        JSON.stringify({ error: "CodeLlama API configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Call the CodeLlama API
    const response = await fetch(CODELLAMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CODELLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "codellama", // Adjust based on actual model name
        messages: [
          {
            role: "system",
            content: systemPrompt || "You are an advanced AI specialized in generating high-quality React code with shadcn/ui components."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2, // Lower temperature for more deterministic code generation
        max_tokens: 4000 // Increase limit for complex widgets
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("CodeLlama API error:", errorText);
      throw new Error(`CodeLlama API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log("CodeLlama API response received");
    
    const generatedCode = data.choices[0]?.message?.content || "";
    
    return new Response(
      JSON.stringify({ generatedCode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in codellama-generate function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
