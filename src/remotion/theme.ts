/**
 * Shared Remotion composition theme. Kept separate from the app shell's
 * Tailwind CSS because Remotion renders may run in an isolated context
 * (the renderer server, not the React app) where only inline styles work.
 */

export const theme = {
  bg: "#0a0a0f",
  fg: "#fafafa",
  muted: "#a1a1aa",
  border: "rgba(255,255,255,0.08)",
  accent: "#a855f7",
  accent2: "#ec4899",
  fontSans:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
  gradient: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
} as const;
