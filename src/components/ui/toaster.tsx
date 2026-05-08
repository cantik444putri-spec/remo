import { Toaster as Sonner } from "sonner";

/**
 * Sonner-based toaster themed to match the shell.
 * Mounted once at the app root.
 */
export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      visibleToasts={4}
      expand
      richColors={false}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "glass text-[var(--color-foreground)] border border-[var(--color-border)] shadow-[var(--shadow-glow)] rounded-[var(--radius-md)]",
          description: "text-[var(--color-muted)]",
          actionButton:
            "bg-[var(--color-accent)] text-white rounded-[var(--radius-sm)]",
          cancelButton:
            "bg-[var(--color-surface)] text-[var(--color-foreground)]",
          title: "text-sm font-medium",
        },
      }}
    />
  );
}
