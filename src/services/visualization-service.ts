
import { supabase } from "@/lib/supabase";
import { SpreadsheetData } from "@/context/SpreadsheetContext";
import { generateVisualizationComponent } from "./component-generator";
import { executeCode } from "./e2b-service";
import { toast } from "sonner";

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
    // Prepare data for the OpenAI API
    const { headers, rows } = spreadsheetData;
    
    // Get a sample of the data (max 20 rows for the prompt)
    const dataSample = rows.slice(0, 20);
    
    // Construct the prompt
    const prompt = {
      query,
      headers,
      dataSample,
      fileName: spreadsheetData.fileName,
      // Explicitly request React and Tailwind CSS
      technologies: {
        frontend: "React",
        styling: "Tailwind CSS",
      }
    };
    
    console.log("Sending visualization request to OpenAI...");
    
    // Call the Supabase Edge Function
    const { data: response, error } = await supabase.functions.invoke(
      "openai-visualization",
      {
        body: prompt
      }
    );
    
    if (error) {
      console.error("Error calling OpenAI API:", error);
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
    
    // Use e2b to execute the code and render the visualization
    console.log("Executing visualization code with E2B...");
    
    // Generate the actual React component from the code
    const component = await renderVisualizationWithE2B(code, rows, visualizationData);
    
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

// New function to use E2B for rendering the visualization
const renderVisualizationWithE2B = async (
  code: string,
  data: any[],
  visualizationData?: any
): Promise<React.ReactNode> => {
  try {
    // Create a wrapper React component that renders the visualization with the data
    const wrapperCode = `
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Cell 
} from 'recharts';

// The generated visualization code
${code}

// Data from the spreadsheet
const data = ${JSON.stringify(data)};
const visualizationData = ${JSON.stringify(visualizationData || null)};

// Render the component to an HTML string
const html = ReactDOMServer.renderToString(
  React.createElement(Visualization, { 
    data: visualizationData || data 
  })
);

console.log(html);
`;

    // Execute the code using e2b
    const result = await executeCode(wrapperCode, "javascript");

    if (result.isError || !result.stdout) {
      throw new Error(result.stderr || "Failed to render visualization");
    }

    // Extract HTML content from the console log output
    const htmlMatch = result.stdout.match(/<([^>]+)>(.*)<\/\1>/s);
    
    if (htmlMatch) {
      // Return a div with the generated HTML content
      return (
        <div dangerouslySetInnerHTML={{ __html: htmlMatch[0] }} />
      );
    } else {
      // If no full HTML match, just use the stdout
      return <div dangerouslySetInnerHTML={{ __html: result.stdout }} />;
    }
  } catch (error) {
    console.error("Error rendering visualization with E2B:", error);
    toast.error("Failed to render visualization");
    
    // Return an error message component
    return (
      <div className="p-4 text-center text-destructive">
        <p className="font-semibold">Failed to render visualization</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }
};
