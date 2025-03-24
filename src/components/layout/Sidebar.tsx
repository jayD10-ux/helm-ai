import { cn } from "@/lib/utils";
import { 
  Terminal, 
  MessageSquare, 
  Component, 
  Settings,
  Network,
  Home,
  LayoutGrid,
  Settings2,
  Code,
  FileSpreadsheet
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
        <button
          onClick={onClick}
          className={cn(
            "flex items-center justify-center w-full p-2 rounded-md transition-colors",
            isActive
              ? "bg-secondary/50 text-secondary-foreground"
              : "text-muted-foreground hover:bg-secondary/20 hover:text-secondary-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      name: "Chat",
      href: "/",
      icon: Home,
    },
    {
      name: "Widgets",
      href: "/widgets",
      icon: LayoutGrid,
    },
    {
      name: "MCPs",
      href: "/mcps",
      icon: Network,
    },
    {
      name: "Playground",
      href: "/playground",
      icon: Code,
    },
    {
      name: "Spreadsheets",
      href: "/spreadsheet",
      icon: FileSpreadsheet,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings2,
    },
  ];

  return (
    <TooltipProvider>
      <div
        className="fixed top-0 left-0 bottom-0 w-[80px] bg-background border-r border-neutral-800 flex flex-col z-20"
      >
        <div className="flex flex-col items-center justify-center h-16">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-primary-foreground">
            <Network className="h-5 w-5" />
          </div>
        </div>

        <div className="flex-1 py-4">
          <nav className="grid gap-4 px-2">
            {navigationItems.map((item) => (
              <NavItem
                key={item.href}
                icon={item.icon}
                label={item.name}
                path={item.href}
                isActive={location.pathname === item.href}
                onClick={() => navigate(item.href)}
              />
            ))}
          </nav>
        </div>
        
        <div className="p-4">
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
      </div>
    </TooltipProvider>
  );
};

export default Sidebar;
