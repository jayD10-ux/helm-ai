
import MainLayout from "@/components/layout/MainLayout";
import MCPsInterface from "@/components/mcps/MCPsInterface";
import { Toaster } from "@/components/ui/toaster";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const MCPs = () => {
  return (
    <MainLayout>
      <Alert className="mb-4 bg-blue-500/10 border-blue-200">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Authentication Required for Full Access</AlertTitle>
        <AlertDescription>
          For MCP servers that require authentication (like Notion, Google Sheets, etc.), 
          you'll need to authenticate after connecting to allow Helm AI to access your data.
          Look for the "Auth Required" badge on connected servers.
        </AlertDescription>
      </Alert>
      <MCPsInterface />
      <Toaster />
    </MainLayout>
  );
};

export default MCPs;
