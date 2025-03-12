
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Component, MoreHorizontal, Trash2, Edit, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { fadeIn } from "@/components/ui/motion";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

interface Widget {
  id: string;
  name: string;
  description: string;
  type: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const WidgetsGrid = () => {
  const { toast } = useToast();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadWidgets();
  }, []);
  
  const loadWidgets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('widgets')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setWidgets(data || []);
    } catch (error) {
      console.error('Error loading widgets:', error);
      toast({
        title: "Error loading widgets",
        description: "Failed to fetch your widgets.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const deleteWidget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('widgets')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Remove the widget from the state
      setWidgets(widgets.filter(widget => widget.id !== id));
      
      toast({
        title: "Widget Deleted",
        description: "The widget has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting widget:', error);
      toast({
        title: "Error deleting widget",
        description: "Failed to delete the widget.",
        variant: "destructive"
      });
    }
  };
  
  // Function to format the date in a readable way
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  const renderWidgets = () => {
    if (loading) {
      return Array(4).fill(0).map((_, index) => (
        <Card key={`skeleton-${index}`} className="glass-morphism hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="ml-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-40 mt-2" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="mt-4 pt-4 h-8 w-full" />
          </CardContent>
        </Card>
      ));
    }
    
    if (widgets.length === 0) {
      return (
        <div className="col-span-1 md:col-span-2 lg:col-span-3 py-12 text-center">
          <Sparkles className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Widgets Yet</h3>
          <p className="text-muted-foreground mb-4">Try asking the AI to create a widget for you</p>
          <Button 
            variant="outline" 
            className="bg-secondary/50"
            onClick={() => window.location.href = '/'}
          >
            Go to Chat
          </Button>
        </div>
      );
    }
    
    return widgets.map((widget) => (
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {}}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => deleteWidget(widget.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Created: {formatDate(widget.created_at)}
              </span>
              <Button variant="outline" size="sm" className="text-xs">
                Open
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };
  
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
        <Button 
          className="bg-secondary/50"
          onClick={() => window.location.href = '/'}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Widget with AI
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderWidgets()}
      </div>
    </motion.div>
  );
};

export default WidgetsGrid;
