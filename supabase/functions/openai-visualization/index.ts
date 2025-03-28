
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.2.1/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const SUPPORTED_MODELS = ['gpt-4o-mini', 'gpt-4o'];
const DEFAULT_MODEL = 'gpt-4o';

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
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const requestBody = await req.json();
    const { query, headers, dataSample, fileName, technologies } = requestBody;
    
    if (!query || !headers || !dataSample) {
      console.error("Missing required parameters:", { query, headers, dataSample });
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Build the prompt for OpenAI
    const systemPrompt = `
You are an expert data visualization developer specialized in creating React components with Tailwind CSS. 
Your task is to create a visualization based on spreadsheet data and a user query.

Rules:
1. ALWAYS create React functional components using the latest best practices
2. ALWAYS use Tailwind CSS for styling
3. Use the recharts library for charts (BarChart, LineChart, PieChart, AreaChart, etc.)
4. Make visualizations responsive and visually appealing
5. Include proper error handling and loading states
6. Follow clean code principles
7. Your component should be named "Visualization" and take a "data" prop
8. DO NOT import any external libraries other than React and recharts
9. DO NOT include import statements or export statements
10. Include proper TypeScript type definitions

The response MUST be in the following JSON format:
{
  "title": "A concise title for the visualization",
  "description": "A brief description of what the visualization shows",
  "type": "bar|line|pie|area|table|custom",
  "code": "// The full React component code",
  "visualizationData": // Optional pre-processed data to be used by the visualization
}
`;

    const userPrompt = `
Create a visualization based on this query: "${query}"

Spreadsheet Information:
- Filename: ${fileName}
- Headers: ${JSON.stringify(headers)}
- Data Sample (first ${dataSample.length} rows): ${JSON.stringify(dataSample, null, 2)}

Technologies:
- Frontend: ${technologies?.frontend || "React"}
- Styling: ${technologies?.styling || "Tailwind CSS"}

Requirements:
1. The visualization should directly address the user's query
2. Provide a high-quality, professional visualization component
3. Use appropriate chart types based on the data
4. Include data transformations if needed
5. Make sure the component is fully functional
6. Use proper TypeScript types
7. The component should be self-contained
`;

    console.log("Sending request to OpenAI API...");

    // Make the request to OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL, // Use gpt-4o for visualizations as they are more complex
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2, // Lower temperature for more deterministic coding output
        max_tokens: 4000
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return new Response(
        JSON.stringify({ error: "Error from OpenAI API: " + (data.error?.message || "Unknown error") }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.choices || data.choices.length === 0) {
      console.error("No response from OpenAI API");
      return new Response(
        JSON.stringify({ error: "No response from OpenAI API" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const visualizationData = data.choices[0].message.content;
    console.log("Received response from OpenAI");
    
    // Extract JSON from the response
    let jsonData;
    try {
      // Try to parse the entire response as JSON first
      jsonData = JSON.parse(visualizationData);
    } catch (parseError) {
      console.log("Failed to parse response as JSON directly, attempting to extract JSON");
      
      // If that fails, try to extract JSON from the response using regex
      const jsonMatch = visualizationData.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
      if (jsonMatch && (jsonMatch[1] || jsonMatch[0])) {
        try {
          jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (extractError) {
          console.error("Failed to parse extracted JSON:", extractError);
          return new Response(
            JSON.stringify({ error: "Failed to parse visualization data" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.error("No JSON found in response");
        return new Response(
          JSON.stringify({ error: "No visualization data found in response" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate the response
    if (!jsonData.code || !jsonData.title || !jsonData.type) {
      console.error("Invalid visualization data:", jsonData);
      return new Response(
        JSON.stringify({ error: "Invalid visualization data" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the code from any code block markers
    if (jsonData.code.startsWith("```") && jsonData.code.endsWith("```")) {
      jsonData.code = jsonData.code.substring(jsonData.code.indexOf("\n") + 1, jsonData.code.lastIndexOf("```"));
    }

    return new Response(
      JSON.stringify(jsonData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in openai-visualization function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
