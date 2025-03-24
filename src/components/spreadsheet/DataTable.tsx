
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps {
  title: string;
  description?: string;
  data: Record<string, any>[];
  columns: string[];
  maxRows?: number;
  className?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  title,
  description,
  data,
  columns,
  maxRows = 5,
  className
}) => {
  const displayData = data.slice(0, maxRows);
  
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-lg">
              <BarChart2 className="h-5 w-5 mr-2 text-primary" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-auto max-h-[250px]">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0">
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column} className="font-medium">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.length > 0 ? (
                displayData.map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={`${index}-${column}`}>
                        {String(row[column] || "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-6 text-muted-foreground">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {data.length > maxRows && (
            <div className="text-center py-2 text-sm text-muted-foreground border-t">
              Showing {maxRows} of {data.length} rows
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataTable;
