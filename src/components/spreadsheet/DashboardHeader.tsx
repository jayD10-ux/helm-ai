
import React from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpreadsheet } from "@/context/SpreadsheetContext";

interface DashboardHeaderProps {
  title?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title = "Dashboard" }) => {
  const { spreadsheetData } = useSpreadsheet();

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      
      {spreadsheetData && (
        <Button variant="outline" className="flex items-center gap-1">
          <CalendarDays className="h-4 w-4" />
          <span>Last 7 days</span>
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
};

export default DashboardHeader;
