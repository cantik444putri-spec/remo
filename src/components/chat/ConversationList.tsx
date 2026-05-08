import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquarePlus,
  Pin,
  PinOff,
  Search,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/chat";

interface ConversationListProps {
  open: boolean;
  onClose?: () => void;
}

export function ConversationList({ open, onClose }: ConversationListProps) {
  const order = useChatStore((s) => s.order);
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const newConversation = useChatStore((s) => s.newConversation);
  const setActive = useChatStore((s) => s.setActive);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const renameConversation = useChatStore((s) => s.renameConversation);
  const togglePin = useChatStore((s) => s.togglePin);

  const [query, setQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId) renameRef.current?.select();
  }, [renamingId]);

  const filtered = order.filter((id) => {
    const conv = conversations[id];
    if (!conv) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    if (conv.title.toLowerCase().includes(q)) return true;
    return conv.messages.some((m) => m.content.toLowerCase().includes(q));
  });

  const startRename = (id: string) => {
    setRenamingId(id);
    setRenameDraft(conversations[id]?.title ?? "");
  };

  const commitRename = () => {
    if (!renamingId) return;
    const title = renameDraft.trim();
    if (title) renameConversation(renamingId, title);
    setRenamingId(null);
  };

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 260, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="shrink-0 overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-bg)]/30"
        >
          <div className="flex h-full w-[260px] flex-col">
            <header className="flex items-center gap-2 border-b border-[var(--color-border)] p-3">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  newConversation();
                  toast("New conversation", { duration: 900 });
                }}
              >
                <MessageSquarePlus className="size-3.5" />
                New
              </Button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
                  aria-label="Close conversation list"
                >
                  <X className="size-4" />
                </button>
              )}
            </header>

            <div className="relative px-3 pt-2">
              <Search className="absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--color-muted)]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="h-8 pl-8 text-xs"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <div className="px-2 py-8 text-center text-xs text-[var(--color-muted)]">
                  {query ? "No matches." : "No conversations yet."}
                </div>
              )}
              <ul className="space-y-1">
                {filtered.map((id) => {
                  const conv = conversations[id];
                  if (!conv) return null;
                  const isActive = id === activeId;
                  return (
                    <li key={id}>
                      <div
                        className={cn(
                          "group flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 transition-colors",
                          isActive
                            ? "bg-[var(--color-surface)] text-[var(--color-foreground)]"
                            : "text-[var(--color-muted)] hover:bg-[var(--color-surface)]/60 hover:text-[var(--color-foreground)]",
                        )}
                      >
                        {conv.pinned && (
                          <Pin className="size-3 shrink-0 text-[var(--color-accent)]" />
                        )}
                        {renamingId === id ? (
                          <Input
                            ref={renameRef}
                            value={renameDraft}
                            onChange={(e) => setRenameDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                commitRename();
                              }
                              if (e.key === "Escape") {
                                e.preventDefault();
                                setRenamingId(null);
                              }
                            }}
                            onBlur={commitRename}
                            className="h-7 flex-1 text-xs"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActive(id)}
                            onDoubleClick={() => startRename(id)}
                            className="flex min-w-0 flex-1 flex-col text-left"
                          >
                            <span className="truncate text-xs font-medium">
                              {conv.title}
                            </span>
                            <span className="truncate text-[10px] text-[var(--color-muted)]">
                              {conv.messages.length} messages ·{" "}
                              {formatTimestamp(conv.updatedAt)}
                            </span>
                          </button>
                        )}
                        {renamingId !== id && (
                          <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <ConvAction
                              onClick={() => togglePin(id)}
                              title={conv.pinned ? "Unpin" : "Pin"}
                              icon={
                                conv.pinned ? (
                                  <PinOff className="size-3" />
                                ) : (
                                  <Pin className="size-3" />
                                )
                              }
                            />
                            <ConvAction
                              onClick={() => startRename(id)}
                              title="Rename"
                              icon={<Pencil className="size-3" />}
                            />
                            <ConvAction
                              onClick={() => {
                                if (
                                  confirm(
                                    `Delete "${conv.title}"? This cannot be undone.`,
                                  )
                                ) {
                                  deleteConversation(id);
                                  toast("Conversation deleted");
                                }
                              }}
                              title="Delete"
                              icon={<Trash2 className="size-3" />}
                              danger
                            />
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function ConvAction({
  icon,
  onClick,
  title,
  danger,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)]",
        danger
          ? "hover:text-red-400"
          : "hover:text-[var(--color-foreground)]",
      )}
    >
      {icon}
    </button>
  );
}

function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d`;
  return new Date(ts).toLocaleDateString();
}
