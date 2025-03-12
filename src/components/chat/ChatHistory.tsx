import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

interface ChatHistoryProps {
  chats: Chat[];
  onSelectChat: (chatId: string) => void;
  currentChatId: string;
}

export function ChatHistory({ chats, onSelectChat, currentChatId }: ChatHistoryProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Chat History</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          {chats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No chat history found
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  chat.id === currentChatId
                    ? "bg-neutral-800"
                    : "hover:bg-neutral-900"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <p className="font-medium truncate">{chat.title}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
