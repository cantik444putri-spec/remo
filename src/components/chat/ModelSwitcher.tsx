import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  CURATED_MODELS,
  DEFAULT_PROVIDER_CONFIGS,
  PROVIDER_ORDER,
  createProvider,
} from "@/lib/providers";
import { useProviderStore } from "@/stores/providers";
import { getSecret } from "@/lib/keystore";
import { cn } from "@/lib/utils";

export function ModelSwitcher() {
  const [open, setOpen] = useState(false);
  const activeProvider = useProviderStore((s) => s.activeProvider);
  const activeModel = useProviderStore((s) => s.activeModel);
  const configs = useProviderStore((s) => s.configs);
  const setActiveProvider = useProviderStore((s) => s.setActiveProvider);
  const setActiveModel = useProviderStore((s) => s.setActiveModel);
  const hasKey = useProviderStore((s) => s.hasKey);

  const [remoteModels, setRemoteModels] = useState<Record<string, string[]>>({});
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // When user opens the switcher, try to fetch models for the active provider
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const cfg = configs[activeProvider];
      if (!cfg.supportsListModels || !hasKey[activeProvider]) return;
      if (remoteModels[activeProvider]) return;
      const key = await getSecret(cfg.apiKeyAlias);
      if (!key) return;
      setLoadingProvider(activeProvider);
      try {
        const provider = createProvider(cfg);
        const models = await provider.listModels(key);
        if (cancelled) return;
        setRemoteModels((prev) => ({
          ...prev,
          [activeProvider]: models.map((m) => m.id).sort(),
        }));
      } catch {
        /* ignore; curated list still shown */
      } finally {
        if (!cancelled) setLoadingProvider(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, activeProvider, configs, hasKey, remoteModels]);

  const items = useMemo(() => {
    return PROVIDER_ORDER.map((pid) => {
      const cfg = configs[pid];
      const curated = CURATED_MODELS[pid] ?? [];
      const remote = remoteModels[pid] ?? [];
      const union = Array.from(new Set([...curated, ...remote]));
      return { pid, cfg, models: union };
    });
  }, [configs, remoteModels]);

  const defaultLabel = DEFAULT_PROVIDER_CONFIGS[activeProvider].label;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1.5 text-xs transition-colors hover:bg-[var(--color-surface)]"
        >
          <Sparkles className="size-3.5 text-[var(--color-accent)]" />
          <span className="text-[var(--color-muted)]">{defaultLabel}</span>
          <span className="font-mono text-[var(--color-foreground)]">
            {activeModel || "(no model)"}
          </span>
          <ChevronDown className="size-3 text-[var(--color-muted)]" />
        </button>
      </Dialog.Trigger>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="fixed left-1/2 top-[16%] z-[91] w-[92vw] max-w-lg -translate-x-1/2"
              >
                <Dialog.Title className="sr-only">Select model</Dialog.Title>
                <Command
                  label="Model Picker"
                  className="glass overflow-hidden rounded-[var(--radius-lg)] shadow-2xl shadow-black/40"
                >
                  <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3">
                    <Sparkles className="size-4 text-[var(--color-accent)]" />
                    <Command.Input
                      placeholder="Search provider / model..."
                      className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
                    />
                  </div>
                  <Command.List className="max-h-[420px] overflow-y-auto p-2">
                    <Command.Empty className="py-8 text-center text-sm text-[var(--color-muted)]">
                      No models match.
                    </Command.Empty>
                    {items.map(({ pid, cfg, models }) => (
                      <Command.Group
                        key={pid}
                        heading={
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                hasKey[pid]
                                  ? "bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400)]"
                                  : "bg-zinc-600",
                              )}
                            />
                            {cfg.label}
                            {loadingProvider === pid && (
                              <span className="text-[10px] text-[var(--color-muted)]">
                                loading…
                              </span>
                            )}
                            {!hasKey[pid] && (
                              <span className="ml-auto text-[10px] text-amber-400/80">
                                no key
                              </span>
                            )}
                          </span>
                        }
                        className="px-2 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]"
                      >
                        {(models.length > 0
                          ? models
                          : pid === "custom"
                            ? ["(set model id in Providers)"]
                            : []
                        ).map((m) => (
                          <Command.Item
                            key={`${pid}:${m}`}
                            value={`${pid} ${m}`}
                            onSelect={() => {
                              setActiveProvider(pid);
                              setActiveModel(m);
                              setOpen(false);
                            }}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-1.5 text-sm data-[selected=true]:bg-[var(--color-surface-hover)]",
                              activeProvider === pid && activeModel === m
                                ? "text-[var(--color-accent)]"
                                : "text-[var(--color-foreground)]",
                            )}
                          >
                            <span className="font-mono text-xs">{m}</span>
                            {activeProvider === pid && activeModel === m && (
                              <span className="ml-auto text-[10px] uppercase tracking-wider">
                                active
                              </span>
                            )}
                          </Command.Item>
                        ))}
                      </Command.Group>
                    ))}
                  </Command.List>
                </Command>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
