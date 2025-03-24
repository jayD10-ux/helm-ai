
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

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
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({ 
          error: "API key not configured",
          status: 500
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const requestData = await req.json();
    const { query, headers, dataSample, fileName } = requestData;

    console.log("Received visualization request:", {
      query,
      fileName,
      headers,
      sampleSize: dataSample.length
    });

    // Prepare the prompt for Gemini
    const systemPrompt = `
You are an expert data visualization system that generates React & Recharts code from spreadsheet data.

Task: Generate a visualization component based on a natural language query.

Guidelines:
1. Generate clean, efficient React code that uses Recharts library.
2. Analyze the data sample to determine best visualization.
3. Use appropriate chart types (bar, line, pie, area) based on the data and query.
4. Return valid JSX React components with Recharts.
5. Don't include imports or exports, just the component definition.
6. Focus on generating accurate data transformations.
7. Keep the code simple yet effective.

Available components from Recharts: 
LineChart, BarChart, PieChart, AreaChart, Line, Bar, Pie, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer

DO NOT use any other external components or imports in your code.

Your response MUST be in this exact JSON format:
{
  "title": "Chart Title",
  "description": "Brief description of the visualization",
  "type": "bar|line|pie|area|table", 
  "code": "JSX React component for the visualization",
  "visualizationData": [] // Transformed data for the visualization
}
`;

    // Prepare sample data for the prompt
    const dataStr = JSON.stringify(dataSample, null, 2);
    
    const userPrompt = `
I need to visualize data from my spreadsheet "${fileName}" based on this query: "${query}"

Here are the column headers: ${JSON.stringify(headers)}

Here's a sample of the data (first ${dataSample.length} rows):
${dataStr}

Generate a visualization component that best addresses my query. Focus on exactly what I asked for.
`;

    // Prepare the request for Gemini
    const geminiRequest = {
      contents: [
        {
          parts: [
            { text: systemPrompt },
            { text: userPrompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      }
    };

    console.log("Sending request to Gemini API");
    
    // Call the Gemini API
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },
      body: JSON.stringify(geminiRequest)
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error("Gemini API error:", responseData);
      return new Response(
        JSON.stringify({ 
          error: `Gemini API error: ${JSON.stringify(responseData)}`,
          status: response.status
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!responseData.candidates || responseData.candidates.length === 0) {
      console.error("No candidates returned from Gemini API:", responseData);
      return new Response(
        JSON.stringify({ 
          error: "No response generated from Gemini API",
          status: 500
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const generatedText = responseData.candidates[0].content.parts[0].text;
    console.log("Generated text length:", generatedText.length);

    // Extract the JSON response from the Gemini output
    try {
      // Try to extract JSON using regex patterns
      const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
      
      if (jsonMatch) {
        const extractedJson = jsonMatch[1] || jsonMatch[0];
        console.log("Extracted JSON:", extractedJson.substring(0, 200) + "...");
        
        const parsedResponse = JSON.parse(extractedJson);
        
        // Return the visualization data
        return new Response(
          JSON.stringify(parsedResponse),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // If we couldn't extract JSON, try to construct a basic response
        console.log("Couldn't extract JSON, using raw text");
        
        return new Response(
          JSON.stringify({
            title: "Generated Visualization",
            description: query,
            type: "custom",
            code: generatedText,
            error: "Failed to parse structured response"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error("Error processing Gemini response:", error);
      return new Response(
        JSON.stringify({ 
          error: `Error processing response: ${error.message}`,
          raw: generatedText,
          status: 500
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error("Unhandled error in generate-visualization function:", error);
    return new Response(
      JSON.stringify({ 
        error: `Unhandled error: ${error.message}`,
        status: 500
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
