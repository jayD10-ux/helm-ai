
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useSpreadsheet } from "@/context/SpreadsheetContext";
import { fadeIn } from "@/components/ui/motion";
import { FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileUpload from "./FileUpload";
import QueryInput from "./QueryInput";
import VisualizationGrid from "./VisualizationGrid";
import SpreadsheetPreview from "./SpreadsheetPreview";
import DashboardHeader from "./DashboardHeader";
import DashboardSummary from "./DashboardSummary";
import DataTable from "./DataTable";

const SpreadsheetInterface = () => {
  const { 
    spreadsheetData, 
    setSpreadsheetData, 
    visualizations,
    loading
  } = useSpreadsheet();
  
  const [showPreview, setShowPreview] = useState(false);

  return (
    <motion.div
      {...fadeIn}
      className="h-full overflow-auto"
    >
      {!spreadsheetData ? (
        <>
          <DashboardHeader title="Spreadsheet Dashboard" />
          <div className="py-12">
            <FileUpload />
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <DashboardHeader title={spreadsheetData.fileName.split('.')[0]} />
            
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
          </div>
          
          <DashboardSummary />
          
          {!showPreview && (
            <div className="mb-6">
              <QueryInput />
            </div>
          )}
          
          {showPreview && <SpreadsheetPreview className="mb-6" />}
          
          {visualizations.length > 0 ? (
            <VisualizationGrid />
          ) : !showPreview && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {spreadsheetData && spreadsheetData.rows.length > 0 && (
                <DataTable
                  title="Data Preview"
                  description="First 5 rows from your spreadsheet"
                  data={spreadsheetData.rows}
                  columns={spreadsheetData.headers.slice(0, 5)}
                  maxRows={5}
                />
              )}
              
              <div className="flex flex-col justify-between h-full">
                <DataTable
                  title="Column Analysis"
                  description="Summary of your data columns"
                  data={spreadsheetData.headers.map(header => {
                    // Get some basic stats for each column
                    const values = spreadsheetData.rows.map(row => row[header]);
                    const uniqueValues = new Set(values).size;
                    const numericValues = values.filter(v => 
                      !isNaN(Number(v)) && v !== null && v !== ''
                    ).length;
                    
                    return {
                      Column: header,
                      "Data Type": numericValues > values.length * 0.8 ? "Numeric" : "Text",
                      "Unique Values": uniqueValues,
                      "% Complete": Math.round((values.filter(v => v !== null && v !== '').length / values.length) * 100) + '%'
                    };
                  })}
                  columns={["Column", "Data Type", "Unique Values", "% Complete"]}
                  maxRows={4}
                />
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default SpreadsheetInterface;
