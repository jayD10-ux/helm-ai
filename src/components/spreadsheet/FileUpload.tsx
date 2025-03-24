
import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpreadsheet } from "@/context/SpreadsheetContext";
import * as XLSX from "xlsx";

const FileUpload = () => {
  const { toast } = useToast();
  const { setSpreadsheetData } = useSpreadsheet();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid Excel or CSV file");
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("File is too large. Please upload a file smaller than 10MB");
      return false;
    }
    
    setError(null);
    return true;
  };

  const processFile = async (file: File) => {
    try {
      setIsLoading(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convert to array of arrays
      const jsonData = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });
      
      if (jsonData.length === 0) {
        throw new Error("The spreadsheet is empty");
      }
      
      // Extract headers from the first row
      const headers = jsonData[0] as string[];
      
      // Extract data rows (skip first row)
      const rows = jsonData.slice(1);
      
      // Set the spreadsheet data in context
      setSpreadsheetData({
        headers,
        rows,
        fileName: file.name,
        lastUpdated: new Date()
      });
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been processed.`,
      });
      
      setSelectedFile(file);
    } catch (err) {
      console.error("Error processing file:", err);
      setError("Failed to process the file. Please try again with a valid spreadsheet.");
      toast({
        title: "Error processing file",
        description: "The file could not be processed.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        processFile(file);
      }
    }
  }, [processFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        processFile(file);
      }
    }
  }, [processFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="w-full bg-card">
      <CardContent className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            dragActive ? "border-primary bg-primary/5" : "border-border"
          } ${error ? "border-destructive/50" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
              <div className="flex items-center space-x-2">
                <File className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={removeFile}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleChange}
                disabled={isLoading}
              />
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Upload Spreadsheet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Drag and drop your Excel or CSV file here
                  </p>
                </div>
                
                {error && (
                  <div className="flex items-center text-destructive text-sm mt-2 bg-destructive/10 p-2 rounded">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {error}
                  </div>
                )}
                
                <div className="flex justify-center">
                  <Button
                    onClick={handleClick}
                    disabled={isLoading}
                    className="mt-2"
                  >
                    {isLoading ? "Processing..." : "Browse Files"}
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Supported formats: .xlsx, .xls, .csv (max 10MB)
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
