
import React, { useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-4">
      <form onSubmit={handleQuerySubmit} className="flex gap-2">
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
      
      <div className="flex flex-wrap gap-2">
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
    </div>
  );
};

export default QueryInput;
