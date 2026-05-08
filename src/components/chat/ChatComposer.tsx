import { useRef, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChatStore } from "@/stores/chat";
import { sendChatMessage } from "@/lib/chatService";

export function ChatComposer() {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const abort = useChatStore((s) => s.abort);

  const onSend = async () => {
    const content = value.trim();
    if (!content || isStreaming) return;
    setValue("");
    try {
      await sendChatMessage({ content });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send";
      toast.error("Chat failed", { description: msg });
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === "Enter" && !e.shiftKey && !e.altKey && !e.ctrlKey) {
      e.preventDefault();
      void onSend();
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  };

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)]/60 p-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              autoResize();
            }}
            onKeyDown={onKeyDown}
            placeholder="Ask anything... Shift+Enter for a new line."
            rows={1}
            className="pr-12"
          />
          <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-[var(--color-muted)]/70">
            Enter ↵
          </div>
        </div>
        {isStreaming ? (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={abort}
            aria-label="Stop generating"
          >
            <Square className="size-4 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={onSend}
            disabled={!value.trim()}
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
