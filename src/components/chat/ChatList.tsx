import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { staggerContainer } from "@/components/ui/motion";
import { ChatMessage } from "./ChatMessage";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ChatListProps {
  messages: Message[];
  isLoading?: boolean;
}

export const ChatList = forwardRef<HTMLDivElement, ChatListProps>(
  ({ messages, isLoading }, ref) => {
    return (
      <div className="flex-1 overflow-y-auto px-4 scrollbar-none">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6 pb-6"
        >
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={ref} />
        </motion.div>
      </div>
    );
  }
);

ChatList.displayName = "ChatList";
