
import React, { useState } from "react";
import { Send, Sparkles, Loader2, PieChart, LineChart, BarChart2, Table2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSpreadsheet } from "@/context/SpreadsheetContext";
import { generateVisualization } from "@/services/visualization-service";
import { toast } from "sonner";

const EXAMPLE_QUERIES = [
  "Show sales by category as a bar chart",
  "Create a pie chart of expenses by department",
  "Display a line chart of monthly revenue trends",
  "Show top 10 customers in a table",
  "Generate a comparison of quarterly sales"
];

const CHART_EXAMPLES = [
  { icon: <BarChart2 className="h-12 w-12" />, title: "Bar Charts", description: "Compare categories" },
  { icon: <PieChart className="h-12 w-12" />, title: "Pie Charts", description: "Show composition" },
  { icon: <LineChart className="h-12 w-12" />, title: "Line Charts", description: "Track changes" },
  { icon: <Table2 className="h-12 w-12" />, title: "Tables", description: "Organize details" }
];

const QueryInput: React.FC = () => {
  const [query, setQuery] = useState("");
  const { spreadsheetData, setLoading, loading, addVisualization, setActiveQuery } = useSpreadsheet();
  
  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error("Please enter a query about your data");
      return;
    }
    
    if (!spreadsheetData) {
      toast.error("No spreadsheet data available");
      return;
    }
    
    try {
      setLoading(true);
      setActiveQuery(query);
      
      // Generate visualization component using Gemini
      const visualization = await generateVisualization(query, spreadsheetData);
      
      // Add the visualization to our list
      addVisualization({
        title: visualization.title || "Generated Visualization",
        description: visualization.description || query,
        type: visualization.type,
        component: visualization.component,
        query: query
      });
      
      // Clear the query input
      setQuery("");
      setActiveQuery("");
      toast.success("Visualization generated successfully!");
      
    } catch (error) {
      console.error("Error generating visualization:", error);
      toast.error("Failed to generate visualization. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleExampleClick = (example: string) => {
    setQuery(example);
  };
  
  return (
    <Card className="border-dashed border-2">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-2">Ask a Question About Your Data</h2>
          <p className="text-muted-foreground">
            Our AI will generate insights and visualizations based on your questions
          </p>
        </div>
        
        <form onSubmit={handleQuerySubmit} className="flex gap-2 mb-4">
          <Input
            placeholder="Ask a question about your data... (e.g., 'Show sales by category as a bar chart')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Generate
          </Button>
        </form>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-sm text-muted-foreground pt-1">Try:</span>
          {EXAMPLE_QUERIES.map((example) => (
            <Button
              key={example}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleExampleClick(example)}
              disabled={loading}
            >
              <Sparkles className="h-3 w-3 mr-1 text-primary" />
              {example}
            </Button>
          ))}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CHART_EXAMPLES.map((example, index) => (
            <div key={index} className="flex flex-col items-center p-4 text-center rounded-lg bg-muted/50">
              <div className="text-primary/80 mb-2">{example.icon}</div>
              <h3 className="font-medium">{example.title}</h3>
              <p className="text-xs text-muted-foreground">{example.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QueryInput;
