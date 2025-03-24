
import { supabase } from "@/lib/supabase";
import { SpreadsheetData } from "@/context/SpreadsheetContext";
import { generateVisualizationComponent } from "./component-generator";

interface GeneratedVisualization {
  title: string;
  description: string;
  type: "bar" | "line" | "pie" | "area" | "table" | "custom";
  component: React.ReactNode;
  data?: any;
  error?: string;
}

export const generateVisualization = async (
  query: string,
  spreadsheetData: SpreadsheetData
): Promise<GeneratedVisualization> => {
  try {
    // Prepare data for the Gemini API
    const { headers, rows } = spreadsheetData;
    
    // Get a sample of the data (max 20 rows for the prompt)
    const dataSample = rows.slice(0, 20);
    
    // Construct the prompt
    const prompt = {
      query,
      headers,
      dataSample,
      fileName: spreadsheetData.fileName
    };
    
    console.log("Sending visualization request to Gemini...");
    
    // Call the Supabase Edge Function
    const { data: response, error } = await supabase.functions.invoke(
      "generate-visualization",
      {
        body: prompt
      }
    );
    
    if (error) {
      console.error("Error calling Gemini API:", error);
      throw new Error(`Failed to generate visualization: ${error.message}`);
    }
    
    if (!response) {
      throw new Error("Empty response from visualization service");
    }
    
    console.log("Received visualization response:", response);
    
    // Extract the visualization details from the response
    const {
      title,
      description,
      type,
      code,
      visualizationData
    } = response;
    
    // Generate the actual React component from the code
    const component = generateVisualizationComponent(code, rows, visualizationData);
    
    return {
      title,
      description,
      type,
      component
    };
  } catch (error) {
    console.error("Error in visualization generation:", error);
    throw error;
  }
};
