import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ConversationList } from "@/components/chat/ConversationList";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { EmptyState } from "@/components/chat/EmptyState";
import { ParametersPanel } from "@/components/chat/ParametersPanel";
import { useChatStore } from "@/stores/chat";
import { useUIStore } from "@/stores/ui";
import { sendChatMessage } from "@/lib/chatService";

export function ChatPage() {
  const activeId = useChatStore((s) => s.activeId);
  const conversations = useChatStore((s) => s.conversations);
  const newConversation = useChatStore((s) => s.newConversation);
  const order = useChatStore((s) => s.order);
  const conv = activeId ? conversations[activeId] ?? null : null;

  const sidebarOpen = useUIStore((s) => s.chatSidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setChatSidebarOpen);
  const paramsOpen = useUIStore((s) => s.chatParamsOpen);
  const setParamsOpen = useUIStore((s) => s.setChatParamsOpen);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = conv?.messages ?? [];
  const lastContent = messages[messages.length - 1]?.content;

  // Auto-create a conversation the first time the user lands on /chat
  // with zero conversations, so the composer has a target.
  useEffect(() => {
    if (!activeId && order.length === 0) {
      newConversation();
    } else if (!activeId && order.length > 0) {
      useChatStore.getState().setActive(order[0]);
    }
  }, [activeId, order, newConversation]);

  // Auto-scroll on new tokens.
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
      className="flex h-full"
    >
      <ConversationList
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <ChatHeader />
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {!conv || messages.length === 0 ? (
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
                {messages.map((turn, i) => (
                  <MessageBubble
                    key={turn.id}
                    turn={turn}
                    isLast={i === messages.length - 1}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
        <ChatComposer />
      </section>

      <ParametersPanel open={paramsOpen} onClose={() => setParamsOpen(false)} />
    </motion.div>
  );
}
