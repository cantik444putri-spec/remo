import { motion } from "framer-motion";
import { Bot, User as UserIcon, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatTurn } from "@/stores/chat";

interface MessageBubbleProps {
  turn: ChatTurn;
}

export function MessageBubble({ turn }: MessageBubbleProps) {
  const isUser = turn.role === "user";
  const isAssistant = turn.role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn("flex gap-3 px-4 py-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full",
          isUser
            ? "bg-[var(--color-surface)] text-[var(--color-foreground)]"
            : "gradient-accent text-white shadow-[var(--shadow-glow)]",
        )}
      >
        {isUser ? (
          <UserIcon className="size-3.5" />
        ) : (
          <Bot className="size-3.5" />
        )}
      </div>
      <div
        className={cn(
          "group max-w-[80%] space-y-1",
          isUser ? "items-end text-right" : "items-start",
        )}
      >
        <div
          className={cn(
            "whitespace-pre-wrap break-words rounded-[var(--radius-lg)] px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-[var(--color-surface)] text-[var(--color-foreground)]"
              : "glass text-[var(--color-foreground)]",
            turn.error && "border border-red-500/40",
          )}
        >
          {turn.content || (turn.pending && !turn.error ? "\u00A0" : "")}
          {turn.pending && !turn.error && (
            <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
          )}
        </div>
        <div
          className={cn(
            "flex items-center gap-2 text-[10px] text-[var(--color-muted)]",
            isUser && "justify-end",
          )}
        >
          {isAssistant && turn.pending && (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" />
              generating
            </span>
          )}
          {turn.error && (
            <span className="inline-flex items-center gap-1 text-red-400">
              <AlertTriangle className="size-3" />
              {turn.error}
            </span>
          )}
          {isAssistant && turn.modelRef && (
            <span className="font-mono">
              {turn.modelRef.provider}·{turn.modelRef.model}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
