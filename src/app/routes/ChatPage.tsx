import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { EmptyState } from "@/components/chat/EmptyState";
import { useChatStore } from "@/stores/chat";
import { sendChatMessage } from "@/lib/chatService";
import { toast } from "sonner";

export function ChatPage() {
  const messages = useChatStore((s) => s.messages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastContent = messages[messages.length - 1]?.content;

  // Auto-scroll to the bottom as new tokens stream in.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, lastContent]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex h-full flex-col"
    >
      <ChatHeader />
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState
            onPick={async (prompt) => {
              try {
                await sendChatMessage({ content: prompt });
              } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed";
                toast.error("Chat failed", { description: msg });
              }
            }}
          />
        ) : (
          <div className="mx-auto max-w-3xl py-4">
            <AnimatePresence initial={false}>
              {messages.map((turn) => (
                <MessageBubble key={turn.id} turn={turn} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <ChatComposer />
    </motion.div>
  );
}
