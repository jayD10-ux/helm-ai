import React from "react";
import { Plus, History } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatHeaderProps {
  onNewChat: () => void;
  onHistoryClick: () => void;
  isLoading: boolean;
}

export function ChatHeader({ onNewChat, onHistoryClick, isLoading }: ChatHeaderProps) {
  return (
    <div className="flex justify-end space-x-2 mb-4 pb-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
              onClick={onHistoryClick}
              disabled={isLoading}
            >
              <History className="h-4 w-4 text-neutral-200" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Chat History</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
              onClick={onNewChat}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 text-neutral-200" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>New Chat</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
