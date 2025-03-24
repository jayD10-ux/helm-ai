
import React, { useCallback, useState } from "react";
import { FileSpreadsheet, Upload, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  loading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, loading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv' // alternative MIME for .csv
    ];
    
    if (!validTypes.includes(file.type)) {
      setFileError("Please upload a valid spreadsheet file (.xlsx, .xls, or .csv)");
      return false;
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setFileError("File is too large. Maximum size is 10MB.");
      return false;
    }
    
    setFileError(null);
    return true;
  };
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      if (validateFile(file)) {
        onFileUpload(file);
      }
    }
  }, [onFileUpload]);
  
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (validateFile(file)) {
        onFileUpload(file);
      }
    }
  }, [onFileUpload]);
  
  return (
    <Card className={`p-8 text-center border-2 border-dashed transition-all ${dragActive ? 'border-primary bg-primary/5' : ''}`}>
      <div 
        className="flex flex-col items-center justify-center h-64"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        {fileError ? (
          <>
            <FileX className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-lg font-medium text-destructive mb-2">Upload Error</h3>
            <p className="text-muted-foreground mb-4">{fileError}</p>
            <Button 
              onClick={() => setFileError(null)}
              variant="outline"
            >
              Try Again
            </Button>
          </>
        ) : loading ? (
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 relative mb-4">
              <div className="absolute animate-ping h-16 w-16 rounded-full bg-primary/20"></div>
              <FileSpreadsheet className="h-16 w-16 text-primary relative" />
            </div>
            <h3 className="text-lg font-medium mb-2">Processing Spreadsheet</h3>
            <p className="text-muted-foreground">This may take a moment for larger files...</p>
          </div>
        ) : (
          <>
            <FileSpreadsheet className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Your Spreadsheet</h3>
            <p className="text-muted-foreground mb-4">
              Drag & drop a .xlsx, .xls, or .csv file here, or click to browse
            </p>
            <label htmlFor="file-upload">
              <Button as="span">
                <Upload className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
              />
            </label>
          </>
        )}
      </div>
    </Card>
  );
};

export default FileUpload;
