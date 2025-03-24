
import React from "react";
import { Info } from "lucide-react";

interface ChatFooterProps {
  isLoading: boolean;
}

export function ChatFooter({ isLoading }: ChatFooterProps) {
  return (
    <div className="mt-2 text-xs text-muted-foreground">
      {!isLoading && (
        <div className="flex items-center gap-1">
          <Info className="w-3 h-3" />
          <span>Try: "Create a widget to send personalized WhatsApp messages to new customers with a customer table"</span>
        </div>
      )}
    </div>
  );
}
