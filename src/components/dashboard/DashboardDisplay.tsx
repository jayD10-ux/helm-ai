
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { executeCode } from "@/services/e2b-service";
import { toast } from "sonner";

interface DashboardDisplayProps {
  code: string;
  data: any;
}

const DashboardDisplay: React.FC<DashboardDisplayProps> = ({ code, data }) => {
  const [rendering, setRendering] = useState(true);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDashboard = async () => {
      try {
        setRendering(true);
        setError(null);

        // Create a wrapper React component that renders the dashboard with the data
        const wrapperCode = `
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Cell 
} from 'recharts';

${code}

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
          setError(result.stderr || "Failed to render dashboard");
          toast.error("Error rendering dashboard");
          console.error("Dashboard render error:", result.stderr);
          return;
        }

        // Extract HTML content from the console log output
        const htmlMatch = result.stdout.match(/<([^>]+)>(.*)<\/\1>/s);
        
        if (htmlMatch) {
          setHtmlContent(htmlMatch[0]);
        } else {
          // If no full HTML match, just use the stdout
          setHtmlContent(`<div>${result.stdout}</div>`);
        }
      } catch (error) {
        console.error("Error executing dashboard code:", error);
        setError(error instanceof Error ? error.message : "Unknown error occurred");
        toast.error("Failed to generate dashboard");
      } finally {
        setRendering(false);
      }
    };

    renderDashboard();
  }, [code, data]);

  if (rendering) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Rendering your dashboard...</p>
        <p className="text-sm text-muted-foreground">This may take a few moments</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 border-destructive">
        <div className="text-center">
          <h3 className="text-lg font-medium text-destructive mb-2">Error Rendering Dashboard</h3>
          <p className="text-sm text-muted-foreground mb-4">There was a problem generating your dashboard.</p>
          <div className="bg-neutral-900 p-4 rounded-md text-left overflow-auto max-h-[300px]">
            <pre className="text-xs text-destructive whitespace-pre-wrap">{error}</pre>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 dashboard-container">
      {htmlContent ? (
        <div 
          className="dashboard-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No dashboard content available</p>
        </div>
      )}
    </Card>
  );
};

export default DashboardDisplay;
