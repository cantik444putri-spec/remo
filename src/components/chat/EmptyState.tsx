import { Sparkles, Film, Tags, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

const suggestions = [
  {
    icon: Lightbulb,
    title: "Brainstorm video concepts",
    prompt:
      "Suggest 10 trending microstock video concepts for the travel niche, with keywords and ideal durations.",
  },
  {
    icon: Film,
    title: "Draft a 30-second script",
    prompt:
      "Write a 30-second script for a motivational morning routine video in a calm, cinematic tone.",
  },
  {
    icon: Tags,
    title: "Microstock metadata",
    prompt:
      "Generate a title, description, and 30 keywords for a sunrise over mountains timelapse clip.",
  },
];

interface EmptyStateProps {
  onPick: (prompt: string) => void;
}

export function EmptyState({ onPick }: EmptyStateProps) {
  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-6 grid size-14 place-items-center rounded-full gradient-accent shadow-[var(--shadow-glow)]"
      >
        <Sparkles className="size-6 text-white" />
      </motion.div>
      <h2 className="text-xl font-semibold tracking-tight">
        <span className="gradient-text">What are we creating today?</span>
      </h2>
      <p className="mt-1 text-center text-sm text-[var(--color-muted)]">
        Multi-provider AI — OpenAI, Mistral, OpenRouter, or your own endpoint.
      </p>

      <div className="mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
        {suggestions.map(({ icon: Icon, title, prompt }) => (
          <button
            key={title}
            type="button"
            onClick={() => onPick(prompt)}
            className="glass group flex flex-col items-start gap-2 rounded-[var(--radius-md)] p-3 text-left transition-all hover:-translate-y-0.5 hover:bg-[var(--color-surface)]"
          >
            <Icon className="size-4 text-[var(--color-accent)]" />
            <div className="text-sm font-medium">{title}</div>
            <div className="line-clamp-2 text-xs text-[var(--color-muted)]">
              {prompt}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
