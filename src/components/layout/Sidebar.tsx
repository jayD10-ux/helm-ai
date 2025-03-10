
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Terminal, MessageSquare, Code, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem = ({ icon: Icon, label, path, isActive, onClick }: NavItemProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out",
        isActive ? "bg-secondary text-white" : "text-gray-400 hover:bg-secondary/30"
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </motion.div>
  );
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Terminal, label: "Chat", path: "/" },
    { icon: Code, label: "Playground", path: "/playground" },
    { icon: MessageSquare, label: "MCPs", path: "/mcps" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <motion.div
      initial={{ width: 250 }}
      animate={{ width: collapsed ? 80 : 250 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-card border-r border-border flex flex-col"
    >
      <div className="p-4 flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 1 }}
          animate={{ opacity: collapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className={cn("font-bold text-xl text-gradient", collapsed && "hidden")}
        >
          Helm AI
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
        >
          <ChevronLeft 
            className={cn(
              "h-5 w-5 transition-transform duration-300",
              collapsed && "rotate-180"
            )} 
          />
        </motion.button>
      </div>
      
      <div className="flex-1 px-2 py-4 space-y-2 overflow-y-auto scrollbar-none">
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
        <div className={cn(
          "flex items-center space-x-3", 
          collapsed && "justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">AI</span>
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-medium">User Account</p>
              <p className="text-xs text-muted-foreground">Free Plan</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
