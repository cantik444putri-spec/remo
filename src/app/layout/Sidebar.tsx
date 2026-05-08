import { NavLink } from "react-router-dom";
import {
  MessageSquare,
  Film,
  Images,
  Plug,
  ListTodo,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeft,
  Command as CommandIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/stores/settings";
import { useUIStore } from "@/stores/ui";

const navItems = [
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/studio", label: "Studio", icon: Film },
  { to: "/microstock", label: "Microstock", icon: Images },
  { to: "/providers", label: "Providers", icon: Plug },
  { to: "/renders", label: "Renders", icon: ListTodo },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function Sidebar() {
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);
  const openPalette = useUIStore((s) => s.setCommandPaletteOpen);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 224 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="relative flex h-full shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)]/40 backdrop-blur-xl"
    >
      {/* Collapse toggle */}
      <div
        className={cn(
          "flex items-center p-3",
          collapsed ? "justify-center" : "justify-end",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={toggleSidebar}
        >
          {collapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>

      {/* Command palette trigger */}
      <button
        onClick={() => openPalette(true)}
        className={cn(
          "mx-3 mb-2 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface)]",
          collapsed && "justify-center px-2",
        )}
        aria-label="Open command palette"
      >
        <CommandIcon className="size-3.5 shrink-0" />
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 items-center justify-between gap-2"
            >
              <span>Search…</span>
              <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-1 py-0.5 font-mono text-[10px]">
                Ctrl K
              </kbd>
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <nav className="flex flex-col gap-1 px-3 pb-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-all",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-[inset_0_0_0_1px_var(--color-border)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface)]/50 hover:text-[var(--color-foreground)]",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute inset-y-1 left-0 w-[3px] rounded-full gradient-accent"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <Icon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    isActive && "text-[var(--color-accent)]",
                  )}
                  strokeWidth={2}
                />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.15 }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-3">
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-[var(--radius-md)] p-3 text-xs text-[var(--color-muted)]"
            >
              <div className="mb-1 font-medium text-[var(--color-foreground)]">
                v0.1.0 · M2
              </div>
              Shell UX · Command Palette · Theming
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
