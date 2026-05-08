import { AnimatePresence, motion } from "framer-motion";
import { PanelRightClose, Thermometer, Zap, BrainCircuit, Sparkles, RotateCcw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useChatStore, type Conversation } from "@/stores/chat";

interface ParametersPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ParametersPanel({ open, onClose }: ParametersPanelProps) {
  const activeId = useChatStore((s) => s.activeId);
  const conversations = useChatStore((s) => s.conversations);
  const conv = activeId ? conversations[activeId] ?? null : null;

  const defaultSystemPrompt = useChatStore((s) => s.defaultSystemPrompt);
  const defaultTemperature = useChatStore((s) => s.defaultTemperature);
  const defaultTopP = useChatStore((s) => s.defaultTopP);
  const defaultMaxTokens = useChatStore((s) => s.defaultMaxTokens);

  const setConversationParam = useChatStore((s) => s.setConversationParam);
  const setDefaultSystemPrompt = useChatStore((s) => s.setDefaultSystemPrompt);
  const setDefaultTemperature = useChatStore((s) => s.setDefaultTemperature);
  const setDefaultTopP = useChatStore((s) => s.setDefaultTopP);
  const setDefaultMaxTokens = useChatStore((s) => s.setDefaultMaxTokens);

  const getValue = <K extends "systemPrompt" | "temperature" | "topP" | "maxTokens">(
    key: K,
  ): NonNullable<Conversation[K]> => {
    if (conv && conv[key] !== undefined) return conv[key] as NonNullable<Conversation[K]>;
    const map = {
      systemPrompt: defaultSystemPrompt,
      temperature: defaultTemperature,
      topP: defaultTopP,
      maxTokens: defaultMaxTokens,
    } as const;
    return map[key] as NonNullable<Conversation[K]>;
  };

  const applyValue = <K extends "systemPrompt" | "temperature" | "topP" | "maxTokens">(
    key: K,
    value: NonNullable<Conversation[K]>,
  ) => {
    if (conv) {
      setConversationParam(conv.id, key, value as never);
    } else {
      const setters = {
        systemPrompt: (v: string) => setDefaultSystemPrompt(v),
        temperature: (v: number) => setDefaultTemperature(v),
        topP: (v: number) => setDefaultTopP(v),
        maxTokens: (v: number) => setDefaultMaxTokens(v),
      } as const;
      (setters[key] as (v: unknown) => void)(value);
    }
  };

  const resetConversationOverride = (
    key: "systemPrompt" | "temperature" | "topP" | "maxTokens",
  ) => {
    if (!conv) return;
    setConversationParam(conv.id, key, undefined as never);
  };

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="shrink-0 overflow-hidden border-l border-[var(--color-border)] bg-[var(--color-bg)]/30"
        >
          <div className="flex h-full w-[320px] flex-col">
            <header className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Sparkles className="size-3.5 text-[var(--color-accent)]" />
                Parameters
              </div>
              <button
                type="button"
                className="rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
                onClick={onClose}
                aria-label="Close parameters panel"
              >
                <PanelRightClose className="size-4" />
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                {conv
                  ? "Applies to this conversation only"
                  : "Default for new conversations"}
              </p>

              {/* System prompt */}
              <div>
                <ParamHeader
                  icon={<BrainCircuit className="size-3.5" />}
                  label="System prompt"
                  overridden={!!(conv && conv.systemPrompt !== undefined)}
                  onReset={
                    conv && conv.systemPrompt !== undefined
                      ? () => resetConversationOverride("systemPrompt")
                      : undefined
                  }
                />
                <Textarea
                  value={getValue("systemPrompt")}
                  onChange={(e) => applyValue("systemPrompt", e.target.value)}
                  className="min-h-[90px] text-xs"
                />
              </div>

              {/* Temperature */}
              <div>
                <ParamHeader
                  icon={<Thermometer className="size-3.5" />}
                  label="Temperature"
                  value={getValue("temperature").toFixed(2)}
                  overridden={!!(conv && conv.temperature !== undefined)}
                  onReset={
                    conv && conv.temperature !== undefined
                      ? () => resetConversationOverride("temperature")
                      : undefined
                  }
                />
                <Slider
                  value={[getValue("temperature")]}
                  min={0}
                  max={2}
                  step={0.05}
                  onValueChange={(v) => applyValue("temperature", v[0] ?? 0.7)}
                />
                <Footnote>Lower = focused, higher = creative.</Footnote>
              </div>

              {/* Top P */}
              <div>
                <ParamHeader
                  icon={<Zap className="size-3.5" />}
                  label="Top P"
                  value={getValue("topP").toFixed(2)}
                  overridden={!!(conv && conv.topP !== undefined)}
                  onReset={
                    conv && conv.topP !== undefined
                      ? () => resetConversationOverride("topP")
                      : undefined
                  }
                />
                <Slider
                  value={[getValue("topP")]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={(v) => applyValue("topP", v[0] ?? 1)}
                />
                <Footnote>Nucleus sampling threshold.</Footnote>
              </div>

              {/* Max tokens */}
              <div>
                <ParamHeader
                  icon={<Zap className="size-3.5" />}
                  label="Max tokens"
                  value={String(getValue("maxTokens"))}
                  overridden={!!(conv && conv.maxTokens !== undefined)}
                  onReset={
                    conv && conv.maxTokens !== undefined
                      ? () => resetConversationOverride("maxTokens")
                      : undefined
                  }
                />
                <Slider
                  value={[getValue("maxTokens")]}
                  min={128}
                  max={16384}
                  step={128}
                  onValueChange={(v) => applyValue("maxTokens", v[0] ?? 2048)}
                />
                <Footnote>Cap on the assistant reply length.</Footnote>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function ParamHeader({
  icon,
  label,
  value,
  overridden,
  onReset,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  overridden?: boolean;
  onReset?: () => void;
}) {
  return (
    <div className="mb-2 flex items-center gap-2 text-xs font-medium">
      <span className="text-[var(--color-muted)]">{icon}</span>
      <span>{label}</span>
      {overridden && (
        <span className="rounded-full bg-[var(--color-accent)]/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          override
        </span>
      )}
      {value !== undefined && (
        <span className="ml-auto font-mono text-[10px] text-[var(--color-muted)]">
          {value}
        </span>
      )}
      {onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-5 px-1 text-[10px]"
          title="Use default"
        >
          <RotateCcw className="size-3" />
        </Button>
      )}
    </div>
  );
}

function Footnote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1 text-[10px] text-[var(--color-muted)]">{children}</div>
  );
}
