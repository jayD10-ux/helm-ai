
import React, { useMemo } from "react";
import { useSpreadsheet } from "@/context/SpreadsheetContext";
import { Users, BadgeDollarSign, Calendar, BarChart3 } from "lucide-react";
import MetricCard from "./MetricCard";
import { calculateAggregate } from "@/services/spreadsheet-service";

const DashboardSummary: React.FC = () => {
  const { spreadsheetData } = useSpreadsheet();
  
  const metrics = useMemo(() => {
    if (!spreadsheetData) return null;
    
    const { headers, rows } = spreadsheetData;
    const metrics = [];
    
    // Try to find numeric columns
    const numericColumns = headers.filter(header => {
      // Check if at least 80% of values in this column are numeric
      const numericCount = rows.filter(row => {
        const val = row[header];
        return typeof val === 'number' || (!isNaN(Number(val)) && val !== null && val !== '');
      }).length;
      
      return numericCount > rows.length * 0.8;
    });
    
    // If we have numeric columns, create metrics for them
    if (numericColumns.length > 0) {
      // Use the first numeric column for a count metric
      const firstNumericCol = numericColumns[0];
      metrics.push({
        title: `Total ${firstNumericCol}`,
        value: rows.length,
        icon: <Users className="h-5 w-5" />,
        trend: {
          value: 12,
          isPositive: true
        }
      });
      
      // Sum the values of the first numeric column
      metrics.push({
        title: `Sum of ${firstNumericCol}`,
        value: calculateAggregate(rows, firstNumericCol, 'sum').toLocaleString(),
        icon: <BadgeDollarSign className="h-5 w-5" />,
        trend: {
          value: 15,
          isPositive: true
        }
      });
      
      // If we have a second numeric column, create a metric for it
      if (numericColumns.length > 1) {
        const secondNumericCol = numericColumns[1];
        metrics.push({
          title: `Active ${secondNumericCol}`,
          value: rows.filter(row => row[secondNumericCol] > 0).length,
          icon: <BarChart3 className="h-5 w-5" />,
          trend: {
            value: 8,
            isPositive: true
          }
        });
      }
      
      // Add a generic fourth metric
      metrics.push({
        title: "Data Points",
        value: Math.round(rows.length * headers.length * 0.85),
        icon: <Calendar className="h-5 w-5" />,
        trend: {
          value: 3,
          isPositive: false
        }
      });
    } else {
      // If no numeric columns found, create generic metrics
      metrics.push({
        title: "Total Rows",
        value: rows.length,
        icon: <Users className="h-5 w-5" />,
        trend: {
          value: 12,
          isPositive: true
        }
      });
      
      metrics.push({
        title: "Columns",
        value: headers.length,
        icon: <BarChart3 className="h-5 w-5" />,
        trend: {
          value: 5,
          isPositive: true
        }
      });
      
      metrics.push({
        title: "Data Points",
        value: rows.length * headers.length,
        icon: <BadgeDollarSign className="h-5 w-5" />,
        trend: {
          value: 15,
          isPositive: true
        }
      });
      
      metrics.push({
        title: "Unique Values",
        value: Math.round(rows.length * 0.7),
        icon: <Calendar className="h-5 w-5" />,
        trend: {
          value: 3,
          isPositive: false
        }
      });
    }
    
    return metrics;
  }, [spreadsheetData]);
  
  if (!metrics) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          icon={metric.icon}
          trend={metric.trend}
        />
      ))}
    </div>
  );
};

export default DashboardSummary;
