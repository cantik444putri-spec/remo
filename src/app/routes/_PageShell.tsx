import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageShellProps {
  title: string;
  description?: string;
  badge?: string;
  children?: ReactNode;
}

export function PageShell({
  title,
  description,
  badge,
  children,
}: PageShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="mx-auto max-w-6xl p-8"
    >
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="gradient-text">{title}</span>
          </h1>
          {description && (
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {description}
            </p>
          )}
        </div>
        {badge && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
            <span className="size-1.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]" />
            {badge}
          </span>
        )}
      </header>
      {children}
    </motion.div>
  );
}
