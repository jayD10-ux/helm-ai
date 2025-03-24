
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import SpreadsheetInterface from "@/components/spreadsheet/SpreadsheetInterface";
import { SpreadsheetProvider } from "@/context/SpreadsheetContext";

const SpreadsheetDashboard = () => {
  return (
    <MainLayout>
      <SpreadsheetProvider>
        <SpreadsheetInterface />
      </SpreadsheetProvider>
    </MainLayout>
  );
};

export default SpreadsheetDashboard;
