import { NavLink } from "react-router-dom";
import {
  MessageSquare,
  Film,
  Images,
  Plug,
  ListTodo,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/studio", label: "Studio", icon: Film },
  { to: "/microstock", label: "Microstock", icon: Images },
  { to: "/providers", label: "Providers", icon: Plug },
  { to: "/renders", label: "Renders", icon: ListTodo },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function Sidebar() {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)]/40 backdrop-blur-xl">
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-[inset_0_0_0_1px_var(--color-border)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface)]/50 hover:text-[var(--color-foreground)]",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    isActive && "text-[var(--color-accent)]",
                  )}
                  strokeWidth={2}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-3">
        <div className="glass rounded-[var(--radius-md)] p-3 text-xs text-[var(--color-muted)]">
          <div className="mb-1 font-medium text-[var(--color-foreground)]">
            v0.1.0 · M1
          </div>
          Scaffold · Tauri 2 · Vite · Tailwind v4
        </div>
      </div>
    </aside>
  );
}
