
import React from "react";
import ReactDOMServer from "react-dom/server";
import { 
  LineChart, BarChart, PieChart, AreaChart, 
  Line, Bar, Pie, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  ResponsiveContainer
} from "recharts";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * This function generates a React component from provided code
 * It uses a safe approach by generating predefined components based on type
 */
export const generateVisualizationComponent = (
  code: string,
  allData: any[],
  visualizationData?: any
): React.ReactNode => {
  try {
    // Extract chart type and configuration from the code
    const chartType = extractChartType(code);
    const chartData = visualizationData || prepareData(code, allData);
    
    // Create appropriate chart component based on type
    switch (chartType) {
      case "bar":
        return generateBarChart(chartData, extractChartConfig(code));
      case "line":
        return generateLineChart(chartData, extractChartConfig(code));
      case "pie":
        return generatePieChart(chartData, extractChartConfig(code));
      case "area":
        return generateAreaChart(chartData, extractChartConfig(code));
      case "table":
        return generateDataTable(chartData, extractChartConfig(code));
      default:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Visualization Error</CardTitle>
              <CardDescription>Could not determine chart type from generated code</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs p-4 bg-muted/30 rounded-md overflow-auto max-h-[300px] whitespace-pre-wrap">
                {code}
              </pre>
            </CardContent>
          </Card>
        );
    }
  } catch (error) {
    console.error("Error generating component:", error);
    
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Visualization Error</CardTitle>
          <CardDescription>Failed to generate component from code</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive mb-4">Error: {String(error)}</div>
          <pre className="text-xs p-4 bg-muted/30 rounded-md overflow-auto max-h-[300px] whitespace-pre-wrap">
            {code}
          </pre>
        </CardContent>
      </Card>
    );
  }
};

// Helper functions to extract chart details from code
const extractChartType = (code: string): string => {
  // Check for specific chart components in the code
  if (code.includes("BarChart")) return "bar";
  if (code.includes("LineChart")) return "line";
  if (code.includes("PieChart")) return "pie";
  if (code.includes("AreaChart")) return "area";
  if (code.includes("Table")) return "table";
  
  // Default to bar if can't determine
  return "bar";
};

const extractChartConfig = (code: string): any => {
  // Extract chart configuration (x and y axes, data keys, etc.)
  const config: any = {
    title: extractValue(code, "title", "Chart"),
    xAxis: extractValue(code, "dataKey", "x"),
    yAxis: extractValue(code, "dataKey", "y"),
    color: extractColors(code)
  };
  
  return config;
};

const extractValue = (code: string, property: string, defaultValue: string): string => {
  const regex = new RegExp(`${property}="([^"]*)"`, "i");
  const match = code.match(regex);
  return match ? match[1] : defaultValue;
};

const extractColors = (code: string): string[] => {
  const defaultColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];
  
  // Try to extract colors from the code
  const colorRegex = /fill="(#[0-9a-f]{6})"/ig;
  const colors: string[] = [];
  let match;
  
  while ((match = colorRegex.exec(code)) !== null) {
    colors.push(match[1]);
  }
  
  return colors.length > 0 ? colors : defaultColors;
};

const prepareData = (code: string, allData: any[]): any[] => {
  // This is a simplified version - in a real implementation, this would
  // parse the code to determine how to transform the data
  // For now, we'll just return the data as is
  return allData.slice(0, 10);
};

// Component generators for different chart types
const generateBarChart = (data: any[], config: any) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={config.yAxis} fill={config.color[0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const generateLineChart = (data: any[], config: any) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={config.yAxis} stroke={config.color[0]} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const generatePieChart = (data: any[], config: any) => {
  const COLORS = config.color;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey={config.yAxis}
                nameKey={config.xAxis}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const generateAreaChart = (data: any[], config: any) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey={config.yAxis} fill={config.color[0]} stroke={config.color[0]} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const generateDataTable = (data: any[], config: any) => {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">No data available</div>
        </CardContent>
      </Card>
    );
  }
  
  const headers = Object.keys(data[0]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-auto max-h-[400px]">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0">
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className="font-medium">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {headers.map((header, cellIndex) => (
                    <TableCell key={`${rowIndex}-${cellIndex}`}>
                      {String(row[header] || "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
