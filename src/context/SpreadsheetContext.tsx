
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

export interface SpreadsheetData {
  headers: string[];
  rows: Record<string, any>[];
  fileName: string;
  lastUpdated: Date;
}

export interface Visualization {
  id: string;
  title: string;
  description: string;
  type: "bar" | "line" | "pie" | "area" | "table" | "custom";
  component: React.ReactNode;
  query: string;
  createdAt: Date;
}

interface SpreadsheetContextProps {
  spreadsheetData: SpreadsheetData | null;
  setSpreadsheetData: (data: SpreadsheetData | null) => void;
  visualizations: Visualization[];
  addVisualization: (visualization: Omit<Visualization, "id" | "createdAt">) => void;
  removeVisualization: (id: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  activeQuery: string;
  setActiveQuery: (query: string) => void;
}

const SpreadsheetContext = createContext<SpreadsheetContextProps | undefined>(undefined);

export const SpreadsheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData | null>(null);
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeQuery, setActiveQuery] = useState("");

  // Load stored data from localStorage on component mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem("spreadsheet_data");
      const storedVisualizations = localStorage.getItem("spreadsheet_visualizations");
      
      if (storedData) {
        setSpreadsheetData(JSON.parse(storedData));
      }
      
      if (storedVisualizations) {
        setVisualizations(JSON.parse(storedVisualizations));
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    if (spreadsheetData) {
      try {
        localStorage.setItem("spreadsheet_data", JSON.stringify(spreadsheetData));
      } catch (error) {
        console.error("Error saving spreadsheet data to localStorage:", error);
        toast.error("Error saving data. File might be too large for local storage.");
      }
    }
  }, [spreadsheetData]);

  // Save visualizations to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("spreadsheet_visualizations", JSON.stringify(visualizations));
    } catch (error) {
      console.error("Error saving visualizations to localStorage:", error);
    }
  }, [visualizations]);

  const addVisualization = (visualization: Omit<Visualization, "id" | "createdAt">) => {
    const newVisualization: Visualization = {
      ...visualization,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    setVisualizations(prev => [newVisualization, ...prev]);
    toast.success(`Added new ${visualization.type} visualization`);
  };

  const removeVisualization = (id: string) => {
    setVisualizations(prev => prev.filter(v => v.id !== id));
    toast.info("Visualization removed");
  };

  return (
    <SpreadsheetContext.Provider
      value={{
        spreadsheetData,
        setSpreadsheetData,
        visualizations,
        addVisualization,
        removeVisualization,
        loading,
        setLoading,
        activeQuery,
        setActiveQuery
      }}
    >
      {children}
    </SpreadsheetContext.Provider>
  );
};

export const useSpreadsheet = () => {
  const context = useContext(SpreadsheetContext);
  if (context === undefined) {
    throw new Error("useSpreadsheet must be used within a SpreadsheetProvider");
  }
  return context;
};
