import { useEffect, useMemo } from "react";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Film,
  Images,
  Plug,
  ListTodo,
  Settings as SettingsIcon,
  Moon,
  Palette,
  Sun,
  PanelLeftClose,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

import { useUIStore } from "@/stores/ui";
import {
  ACCENT_PRESETS,
  type AccentKey,
  useSettingsStore,
} from "@/stores/settings";
import { useStudioStore } from "@/stores/studio";

interface NavItem {
  label: string;
  icon: typeof MessageSquare;
  to: string;
  keywords?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Chat",
    icon: MessageSquare,
    to: "/chat",
    keywords: ["ai", "assistant", "openai", "mistral"],
  },
  {
    label: "Studio",
    icon: Film,
    to: "/studio",
    keywords: ["remotion", "video", "preview", "render"],
  },
  {
    label: "Microstock",
    icon: Images,
    to: "/microstock",
    keywords: ["metadata", "keywords", "shutterstock", "adobe"],
  },
  {
    label: "Providers",
    icon: Plug,
    to: "/providers",
    keywords: ["api key", "base url", "credentials"],
  },
  {
    label: "Renders",
    icon: ListTodo,
    to: "/renders",
    keywords: ["queue", "progress", "export", "mp4"],
  },
  {
    label: "Settings",
    icon: SettingsIcon,
    to: "/settings",
    keywords: ["preferences", "theme", "shortcut"],
  },
];

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const theme = useSettingsStore((s) => s.theme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);
  const setAccent = useSettingsStore((s) => s.setAccent);
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const navigate = useNavigate();

  // Close palette when the user navigates via keyboard
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, setOpen]);

  const go = (to: string, label: string) => {
    navigate(to);
    setOpen(false);
    toast.success(`Navigated to ${label}`, { duration: 1200 });
  };

  const accentEntries = useMemo(
    () =>
      (Object.entries(ACCENT_PRESETS) as [
        AccentKey,
        (typeof ACCENT_PRESETS)[AccentKey],
      ][]).map(([key, preset]) => ({ key, preset })),
    [],
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="fixed left-1/2 top-[18%] z-[101] w-[92vw] max-w-xl -translate-x-1/2"
              >
                <Dialog.Title className="sr-only">Command palette</Dialog.Title>
                <Dialog.Description className="sr-only">
                  Search or run a command.
                </Dialog.Description>
                <Command
                  label="Command Menu"
                  className="glass overflow-hidden rounded-[var(--radius-lg)] shadow-2xl shadow-black/40"
                >
                  <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3">
                    <Sparkles className="size-4 text-[var(--color-accent)]" />
                    <Command.Input
                      placeholder="Type a command or search..."
                      className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
                    />
                    <kbd className="hidden rounded border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-muted)] sm:inline">
                      Esc
                    </kbd>
                  </div>
                  <Command.List className="max-h-[360px] overflow-y-auto p-2">
                    <Command.Empty className="py-10 text-center text-sm text-[var(--color-muted)]">
                      No results found.
                    </Command.Empty>

                    <Command.Group
                      heading="Navigation"
                      className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]"
                    >
                      {NAV_ITEMS.map(({ label, icon: Icon, to, keywords }) => (
                        <Command.Item
                          key={to}
                          value={`${label} ${keywords?.join(" ") ?? ""}`}
                          onSelect={() => go(to, label)}
                          className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-foreground)] data-[selected=true]:bg-[var(--color-surface-hover)]"
                        >
                          <Icon className="size-4 text-[var(--color-muted)]" />
                          <span>{label}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>

                    <Command.Group
                      heading="Appearance"
                      className="px-2 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]"
                    >
                      <Command.Item
                        value="toggle theme oled dark"
                        onSelect={() => {
                          toggleTheme();
                          setOpen(false);
                          toast("Theme switched", {
                            description:
                              theme === "dark"
                                ? "OLED true-black"
                                : "Dark zinc",
                            duration: 1400,
                          });
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-foreground)] data-[selected=true]:bg-[var(--color-surface-hover)]"
                      >
                        {theme === "oled" ? (
                          <Sun className="size-4 text-[var(--color-muted)]" />
                        ) : (
                          <Moon className="size-4 text-[var(--color-muted)]" />
                        )}
                        <span>
                          Toggle theme ·{" "}
                          <span className="text-[var(--color-muted)]">
                            current: {theme}
                          </span>
                        </span>
                      </Command.Item>
                      {accentEntries.map(({ key, preset }) => (
                        <Command.Item
                          key={key}
                          value={`accent ${key} ${preset.label}`}
                          onSelect={() => {
                            setAccent(key);
                            setOpen(false);
                            toast(`Accent: ${preset.label}`, {
                              duration: 1200,
                            });
                          }}
                          className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-foreground)] data-[selected=true]:bg-[var(--color-surface-hover)]"
                        >
                          <Palette className="size-4 text-[var(--color-muted)]" />
                          <span>Accent: {preset.label}</span>
                          <span
                            className="ml-auto size-4 rounded-full border border-white/10"
                            style={{
                              background: `linear-gradient(135deg, hsl(${preset.from}), hsl(${preset.to}))`,
                            }}
                          />
                        </Command.Item>
                      ))}
                    </Command.Group>

                    <Command.Group
                      heading="Layout"
                      className="px-2 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]"
                    >
                      <Command.Item
                        value="toggle sidebar collapse"
                        onSelect={() => {
                          toggleSidebar();
                          setOpen(false);
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-foreground)] data-[selected=true]:bg-[var(--color-surface-hover)]"
                      >
                        <PanelLeftClose className="size-4 text-[var(--color-muted)]" />
                        <span>Toggle sidebar</span>
                        <kbd className="ml-auto rounded border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-muted)]">
                          Ctrl+B
                        </kbd>
                      </Command.Item>
                      <Command.Item
                        value="restart onboarding tour first run"
                        onSelect={() => {
                          setOnboarded(false);
                          setOpen(false);
                          toast("Onboarding restarted");
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-foreground)] data-[selected=true]:bg-[var(--color-surface-hover)]"
                      >
                        <Sparkles className="size-4 text-[var(--color-muted)]" />
                        <span>Restart onboarding</span>
                      </Command.Item>
                    </Command.Group>

                    <Command.Group
                      heading="Studio"
                      className="px-2 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]"
                    >
                      <Command.Item
                        value="generate storyboard ai wand remotion"
                        onSelect={() => {
                          navigate("/studio");
                          useStudioStore.getState().setStoryboardPanelOpen(true);
                          setOpen(false);
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-foreground)] data-[selected=true]:bg-[var(--color-surface-hover)]"
                      >
                        <Sparkles className="size-4 text-[var(--color-muted)]" />
                        <span>Generate storyboard with AI</span>
                      </Command.Item>
                    </Command.Group>
                  </Command.List>
                  <div className="flex items-center justify-between border-t border-[var(--color-border)] px-3 py-2 text-[11px] text-[var(--color-muted)]">
                    <div className="flex items-center gap-2">
                      <span className="gradient-text font-semibold">RSTM</span>
                      <span>·</span>
                      <span>M8 · Render pipeline</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-1.5 py-0.5 font-mono">
                        ↑↓
                      </kbd>
                      <span>navigate</span>
                      <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-1.5 py-0.5 font-mono">
                        ↵
                      </kbd>
                      <span>select</span>
                    </div>
                  </div>
                </Command>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
