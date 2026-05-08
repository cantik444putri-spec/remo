import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  Check,
  Copy,
  Loader2,
  PencilLine,
  RotateCw,
  User as UserIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownMessage } from "./MarkdownMessage";
import type { ChatTurn } from "@/stores/chat";
import { editAndResubmit, regenerateLastTurn } from "@/lib/chatService";
import { useChatStore } from "@/stores/chat";

interface MessageBubbleProps {
  turn: ChatTurn;
  isLast: boolean;
}

export function MessageBubble({ turn, isLast }: MessageBubbleProps) {
  const isUser = turn.role === "user";
  const isAssistant = turn.role === "assistant";
  const isStreaming = useChatStore((s) => s.isStreaming);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(turn.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(draft.length, draft.length);
    }
  }, [editing, draft.length]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(turn.content);
      toast.success("Copied to clipboard", { duration: 1000 });
    } catch {
      toast.error("Clipboard unavailable");
    }
  };

  const onStartEdit = () => {
    setDraft(turn.content);
    setEditing(true);
  };

  const onCancelEdit = () => {
    setEditing(false);
    setDraft(turn.content);
  };

  const onSaveEdit = async () => {
    setEditing(false);
    try {
      await editAndResubmit(turn.id, draft);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Edit failed";
      toast.error("Edit failed", { description: msg });
    }
  };

  const onRegenerate = async () => {
    try {
      await regenerateLastTurn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Regenerate failed";
      toast.error("Regenerate failed", { description: msg });
    }
  };

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
        {editing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.ctrlKey &&
                  !e.metaKey
                ) {
                  e.preventDefault();
                  void onSaveEdit();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  onCancelEdit();
                }
              }}
              className="min-h-[60px]"
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                <X className="size-3.5" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onSaveEdit}
                disabled={!draft.trim() || draft.trim() === turn.content.trim() || isStreaming}
              >
                <Check className="size-3.5" />
                Save & regenerate
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-[var(--radius-lg)] px-4 py-2.5 text-sm leading-relaxed",
              isUser
                ? "bg-[var(--color-surface)] text-[var(--color-foreground)]"
                : "glass text-[var(--color-foreground)]",
              turn.error && "border border-red-500/40",
            )}
          >
            {isAssistant ? (
              <MarkdownMessage content={turn.content} />
            ) : (
              <div className="whitespace-pre-wrap break-words">
                {turn.content || (turn.pending && !turn.error ? "\u00A0" : "")}
              </div>
            )}
            {turn.pending && !turn.error && isAssistant && !turn.content && (
              <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
            )}
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-1.5 text-[10px] text-[var(--color-muted)]",
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
          {isAssistant && !turn.pending && turn.modelRef && (
            <span className="font-mono">
              {turn.modelRef.provider}·{turn.modelRef.model}
            </span>
          )}

          {/* Action toolbar */}
          {!editing && !turn.pending && turn.content && (
            <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={onCopy}
                title="Copy"
                className="rounded p-1 hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
              >
                <Copy className="size-3" />
              </button>
              {isUser && !isStreaming && (
                <button
                  type="button"
                  onClick={onStartEdit}
                  title="Edit & regenerate"
                  className="rounded p-1 hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
                >
                  <PencilLine className="size-3" />
                </button>
              )}
              {isAssistant && isLast && !isStreaming && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  title="Regenerate"
                  className="rounded p-1 hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
                >
                  <RotateCw className="size-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
