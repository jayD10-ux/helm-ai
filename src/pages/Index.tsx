
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import ChatInterface from "@/components/chat/ChatInterface";
import { SpreadsheetProvider } from "@/context/SpreadsheetContext";

const Index = () => {
  return (
    <MainLayout>
      <SpreadsheetProvider>
        <ChatInterface />
      </SpreadsheetProvider>
    </MainLayout>
  );
};

export default Index;
