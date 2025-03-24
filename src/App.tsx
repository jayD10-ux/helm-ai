import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Index from "./pages/Index";
import Widgets from "./pages/Widgets";
import MCPs from "./pages/MCPs";
import Settings from "./pages/Settings";
import Playground from "./pages/Playground";
import OAuthCallback from "./pages/OAuthCallback";
import NotFound from "./pages/NotFound";
import SpreadsheetDashboard from "./pages/SpreadsheetDashboard";

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter basename="/">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="helm-ui-theme">
          <div className="h-screen w-screen overflow-hidden">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/widgets" element={<Widgets />} />
              <Route path="/mcps" element={<MCPs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/spreadsheet" element={<SpreadsheetDashboard />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
