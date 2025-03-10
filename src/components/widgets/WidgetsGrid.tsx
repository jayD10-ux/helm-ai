
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Component, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fadeIn } from "@/components/ui/motion";

const WidgetsGrid = () => {
  const [widgets, setWidgets] = useState([
    { id: 1, name: "Weather Widget", description: "Shows current weather data", lastModified: "2 days ago" },
    { id: 2, name: "Stock Tracker", description: "Real-time stock price updates", lastModified: "1 week ago" },
    { id: 3, name: "Calendar Events", description: "Upcoming calendar events", lastModified: "3 days ago" },
    { id: 4, name: "Task List", description: "Your current tasks and to-dos", lastModified: "Yesterday" },
  ]);
  
  return (
    <motion.div
      {...fadeIn}
      className="h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Widgets</h1>
          <p className="text-muted-foreground">Manage and customize your widgets</p>
        </div>
        <Button className="bg-secondary/50">
          <Plus className="h-4 w-4 mr-2" />
          New Widget
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <Card key={widget.id} className="glass-morphism hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-md bg-secondary/50 flex items-center justify-center mr-3">
                    <Component className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{widget.name}</h3>
                    <p className="text-sm text-muted-foreground">{widget.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Last modified: {widget.lastModified}</span>
                  <Button variant="outline" size="sm" className="text-xs">
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};

export default WidgetsGrid;
