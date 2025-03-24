
import * as XLSX from 'xlsx';

export interface ParsedSpreadsheet {
  headers: string[];
  rows: Record<string, any>[];
  fileName: string;
}

export const parseSpreadsheetFile = async (file: File): Promise<ParsedSpreadsheet> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert the worksheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Extract headers (column names)
        const headers = Object.keys(jsonData[0] || {});
        
        resolve({
          headers,
          rows: jsonData as Record<string, any>[],
          fileName: file.name
        });
      } catch (error) {
        console.error('Error parsing spreadsheet:', error);
        reject(new Error('Failed to parse spreadsheet. Please check the file format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading the file. Please try again.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Helper function to get a sample of data (for previews)
export const getDataSample = (data: Record<string, any>[], count: number = 5) => {
  return data.slice(0, count);
};

// Helper function to filter data based on criteria
export const filterData = (data: Record<string, any>[], field: string, value: any) => {
  return data.filter(item => item[field] === value);
};

// Helper function to group data by a field
export const groupData = (data: Record<string, any>[], field: string) => {
  return data.reduce((groups, item) => {
    const key = item[field];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, Record<string, any>[]>);
};

// Helper function to calculate aggregate values (sum, average, etc.)
export const calculateAggregate = (
  data: Record<string, any>[], 
  field: string, 
  aggregation: 'sum' | 'avg' | 'max' | 'min' | 'count' = 'sum'
) => {
  if (data.length === 0) return 0;
  
  switch (aggregation) {
    case 'sum':
      return data.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
    case 'avg':
      return data.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0) / data.length;
    case 'max':
      return Math.max(...data.map(item => parseFloat(item[field]) || 0));
    case 'min':
      return Math.min(...data.map(item => parseFloat(item[field]) || 0));
    case 'count':
      return data.length;
    default:
      return 0;
  }
};
