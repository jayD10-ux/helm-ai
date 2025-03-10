
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <motion.main 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "flex-1 overflow-auto",
          "scrollbar-none"
        )}
      >
        <div className="container mx-auto p-6 max-w-7xl">
          {children}
        </div>
      </motion.main>
    </div>
  );
};

export default MainLayout;
