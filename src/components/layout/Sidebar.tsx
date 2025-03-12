import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Terminal, 
  MessageSquare, 
  Component, 
  Settings, 
  Network
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem = ({ icon: Icon, label, path, isActive, onClick }: NavItemProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out",
            isActive ? "bg-secondary text-white" : "text-gray-400 hover:bg-secondary/30"
          )}
          onClick={onClick}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Terminal, label: "Chat", path: "/" },
    { icon: Component, label: "Widgets", path: "/widgets" },
    { icon: MessageSquare, label: "MCPs", path: "/mcps" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ width: 80 }}
        animate={{ width: collapsed ? 80 : 250 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="h-screen bg-card border-r border-border flex flex-col"
      >
        <div className="p-4 flex justify-between items-center">
          {collapsed ? (
            <div className="flex justify-center items-center w-full">
              <Network className="h-6 w-6 text-primary" />
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="font-bold text-xl text-gradient flex items-center gap-2"
            >
              <Network className="h-6 w-6 text-primary" />
              <span>Helm AI</span>
            </motion.div>
          )}
          {!collapsed && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" /> 
            </motion.button>
          )}
        </div>
        
        <div className="flex-1 px-2 py-4 space-y-4 overflow-y-auto scrollbar-none flex flex-col items-center">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              isActive={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>
        
        <div className="p-4 border-t border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">AI</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-sm font-medium">User Account</p>
              <p className="text-xs text-muted-foreground">Free Plan</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {collapsed && (
          <div className="p-2 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleSidebar}
                  className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 rotate-180" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Expand Sidebar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </motion.div>
    </TooltipProvider>
  );
};

export default Sidebar;
