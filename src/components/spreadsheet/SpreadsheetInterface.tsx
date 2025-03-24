
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useSpreadsheet } from "@/context/SpreadsheetContext";
import { fadeIn } from "@/components/ui/motion";
import { Sparkles, FileSpreadsheet, BarChart3, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileUpload from "./FileUpload";
import QueryInput from "./QueryInput";
import VisualizationGrid from "./VisualizationGrid";
import SpreadsheetPreview from "./SpreadsheetPreview";

const SpreadsheetInterface = () => {
  const { 
    spreadsheetData, 
    setSpreadsheetData, 
    visualizations,
    loading,
    setLoading
  } = useSpreadsheet();
  
  const [showPreview, setShowPreview] = useState(false);

  return (
    <motion.div
      {...fadeIn}
      className="h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Spreadsheet Dashboard</h1>
          <p className="text-muted-foreground">Upload a spreadsheet and generate insights with AI</p>
        </div>
        
        {spreadsheetData && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(!showPreview)}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {showPreview ? "Hide Data" : "Show Data"}
            </Button>
            
            <Button onClick={() => setSpreadsheetData(null)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload New File
            </Button>
          </div>
        )}
      </div>
      
      {!spreadsheetData ? (
        <FileUpload />
      ) : (
        <div className="space-y-6">
          {showPreview && <SpreadsheetPreview />}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                Generate Visualizations with AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QueryInput />
            </CardContent>
          </Card>
          
          {visualizations.length > 0 ? (
            <VisualizationGrid />
          ) : (
            <div className="mt-8 text-center p-12 border border-dashed rounded-lg">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Visualizations Yet</h3>
              <p className="text-muted-foreground mb-4">
                Try asking a question about your data to generate insights
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Visualization
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default SpreadsheetInterface;
