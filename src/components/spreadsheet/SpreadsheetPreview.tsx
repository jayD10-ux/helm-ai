
import React, { useState } from "react";
import { useSpreadsheet } from "@/context/SpreadsheetContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, Search } from "lucide-react";
import { format } from "date-fns";

const SpreadsheetPreview = () => {
  const { spreadsheetData } = useSpreadsheet();
  const [searchTerm, setSearchTerm] = useState("");
  
  if (!spreadsheetData) return null;
  
  const { headers, rows, fileName, lastUpdated } = spreadsheetData;
  
  // Filter rows based on search term
  const filteredRows = rows.filter(row => 
    Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  // Get a sample of rows for preview (max 100 for performance)
  const displayRows = filteredRows.slice(0, 100);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            {fileName}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Last updated: {format(new Date(lastUpdated), "PPp")}
          </div>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search data..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
              {displayRows.length > 0 ? (
                displayRows.map((row, index) => (
                  <TableRow key={index}>
                    {headers.map((header) => (
                      <TableCell key={`${index}-${header}`}>
                        {String(row[header] || "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={headers.length} className="text-center py-6 text-muted-foreground">
                    {searchTerm ? "No matching data found" : "No data available"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {filteredRows.length > 100 && (
            <div className="text-center py-2 text-sm text-muted-foreground border-t">
              Showing 100 of {filteredRows.length} rows
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpreadsheetPreview;
