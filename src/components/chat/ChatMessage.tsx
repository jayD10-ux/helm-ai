import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { slideIn } from "@/components/ui/motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Clock } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.sender === "user";
  
  return (
    <motion.div
      variants={slideIn}
      className="group relative flex items-start gap-3"
    >
      <div className="flex size-8 shrink-0 select-none items-center justify-center rounded-md bg-neutral-900 shadow">
        <Avatar className="h-8 w-8">
          <AvatarFallback className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
            isUser ? "bg-neutral-800 text-neutral-200" : "bg-neutral-800 text-neutral-200"
          )}>
            {isUser ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="font-semibold">{isUser ? "You" : "Helm AI"}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="prose prose-neutral dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 break-words text-sm">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </motion.div>
  );
}
