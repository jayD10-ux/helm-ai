
import MainLayout from "@/components/layout/MainLayout";
import MCPsInterface from "@/components/mcps/MCPsInterface";
import { Toaster } from "@/components/ui/toaster";

const MCPs = () => {
  return (
    <MainLayout>
      <MCPsInterface />
      <Toaster />
    </MainLayout>
  );
};

export default MCPs;
