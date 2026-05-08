import { PanelLeft, PanelRight, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chat";
import { useUIStore } from "@/stores/ui";
import { ModelSwitcher } from "./ModelSwitcher";

export function ChatHeader() {
  const activeId = useChatStore((s) => s.activeId);
  const conversations = useChatStore((s) => s.conversations);
  const removeMessagesFrom = useChatStore((s) => s.removeMessagesFrom);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const conv = activeId ? conversations[activeId] : null;

  const sidebarOpen = useUIStore((s) => s.chatSidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleChatSidebar);
  const paramsOpen = useUIStore((s) => s.chatParamsOpen);
  const toggleParams = useUIStore((s) => s.toggleChatParams);

  const onClear = () => {
    if (!conv || conv.messages.length === 0) return;
    if (!confirm("Clear all messages in this conversation?")) return;
    const firstId = conv.messages[0].id;
    removeMessagesFrom(firstId);
  };

  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/50 px-4 py-2 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={toggleSidebar}
          aria-pressed={sidebarOpen}
          title={sidebarOpen ? "Hide conversations" : "Show conversations"}
        >
          <PanelLeft className="size-4" />
        </Button>
        <ModelSwitcher />
        {conv && (
          <span className="truncate text-xs text-[var(--color-muted)]">
            {conv.title}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={isStreaming || !conv || conv.messages.length === 0}
          onClick={onClear}
        >
          <Trash2 className="size-3.5" />
          Clear
        </Button>
        <Button
          variant={paramsOpen ? "secondary" : "ghost"}
          size="icon"
          className="size-8"
          onClick={toggleParams}
          aria-pressed={paramsOpen}
          title={paramsOpen ? "Hide parameters" : "Show parameters"}
        >
          {paramsOpen ? (
            <PanelRight className="size-4" />
          ) : (
            <Settings2 className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
