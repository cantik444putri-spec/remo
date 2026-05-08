import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chat";
import { ModelSwitcher } from "./ModelSwitcher";

export function ChatHeader() {
  const clear = useChatStore((s) => s.clear);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const messagesLen = useChatStore((s) => s.messages.length);

  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/50 px-4 py-2 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <ModelSwitcher />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={isStreaming || messagesLen === 0}
          onClick={clear}
        >
          <Trash2 className="size-3.5" />
          Clear
        </Button>
      </div>
    </div>
  );
}
