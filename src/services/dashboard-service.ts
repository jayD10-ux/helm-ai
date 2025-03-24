
import { supabase } from "@/lib/supabase";
import { executeCode } from "./e2b-service";
import { toast } from "sonner";

interface SpreadsheetData {
  headers: string[];
  rows: any[];
  fileName: string;
  lastUpdated: Date;
}

/**
 * Executes React dashboard code and returns the rendered HTML
 */
export const renderDashboard = async (
  dashboardCode: string,
  data: SpreadsheetData
): Promise<string> => {
  try {
    // Create a wrapper React component that renders the dashboard with the data
    const wrapperCode = `
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Cell 
} from 'recharts';

${dashboardCode}

// Sample dashboard data from the spreadsheet
const data = ${JSON.stringify(data.rows)};

// Render the dashboard component to HTML string
const html = ReactDOMServer.renderToString(
  React.createElement(Dashboard, { data })
);

console.log(html);
`;

    // Execute the code using e2b
    const result = await executeCode(wrapperCode, "javascript");

    if (result.isError || !result.stdout) {
      throw new Error(result.stderr || "Failed to render dashboard");
    }

    // Extract HTML content from the console log output
    const htmlMatch = result.stdout.match(/<([^>]+)>(.*)<\/\1>/s);
    
    if (htmlMatch) {
      return htmlMatch[0];
    }

    // If no full HTML match, just use the stdout
    return `<div>${result.stdout}</div>`;
  } catch (error) {
    console.error("Error rendering dashboard:", error);
    throw error;
  }
};

/**
 * Generates dashboard code based on a user query and spreadsheet data
 */
export const generateDashboardCode = async (
  query: string,
  data: SpreadsheetData
): Promise<string> => {
  try {
    console.log("Generating dashboard for query:", query);
    
    const prompt = `
Generate a React dashboard using the following spreadsheet data:
- Filename: ${data.fileName}
- Headers: ${JSON.stringify(data.headers)}
- Data sample: ${JSON.stringify(data.rows.slice(0, 5))}

User query: "${query}"

Create a comprehensive dashboard with Tailwind CSS and shadcn UI components that includes:
1. Summary statistics for key metrics
2. Appropriate charts based on the data (bar, line, pie, etc.)
3. Data tables where appropriate
4. Responsive layout

Export the dashboard as a React component named Dashboard that accepts a 'data' prop.
Use recharts library for data visualization.
The dashboard code should be valid JSX without any imports or exports.
    `;

    // Call the Supabase Edge Function
    const { data: response, error } = await supabase.functions.invoke(
      "generate-dashboard",
      {
        body: { prompt, headers: data.headers, fileName: data.fileName }
      }
    );
    
    if (error) {
      console.error("Error calling AI service:", error);
      throw new Error(`Failed to generate dashboard: ${error.message}`);
    }
    
    if (!response || !response.code) {
      throw new Error("Empty response from dashboard generation service");
    }
    
    return response.code;
  } catch (error) {
    console.error("Error in dashboard generation:", error);
    throw error;
  }
};

/**
 * Saves a generated dashboard to the database
 */
export const saveDashboard = async (
  title: string,
  description: string,
  code: string,
  spreadsheetData: SpreadsheetData
) => {
  try {
    const { data, error } = await supabase
      .from('dashboards')
      .insert([
        {
          title,
          description,
          code,
          data: spreadsheetData.rows,
          headers: spreadsheetData.headers,
          file_name: spreadsheetData.fileName,
          created_at: new Date()
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    toast.success("Dashboard saved successfully");
    return data[0];
  } catch (error) {
    console.error("Error saving dashboard:", error);
    toast.error("Failed to save dashboard");
    throw error;
  }
};
