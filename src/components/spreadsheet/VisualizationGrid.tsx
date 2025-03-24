
import React from "react";
import { useSpreadsheet } from "@/context/SpreadsheetContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { BarChart3, MoreHorizontal, Trash2, Clock, Share2 } from "lucide-react";
import { format } from "date-fns";

const VisualizationGrid: React.FC = () => {
  const { visualizations, removeVisualization } = useSpreadsheet();
  
  if (!visualizations.length) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {visualizations.map((visualization) => (
        <Card key={visualization.id} className="glass-morphism hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  {visualization.title}
                </CardTitle>
                <CardDescription>{visualization.description}</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => removeVisualization(visualization.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3 mr-1" />
              Created {format(new Date(visualization.createdAt), "PPp")}
            </div>
          </CardHeader>
          <CardContent>
            {visualization.component}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VisualizationGrid;
