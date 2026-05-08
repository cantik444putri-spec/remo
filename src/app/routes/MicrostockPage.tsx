import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageShell } from "./_PageShell";
import { Lightbulb, Tags, Layers } from "lucide-react";

const tools = [
  {
    icon: Lightbulb,
    title: "Idea Generator",
    description:
      "Niche prompt → 20 video concepts with keyword, duration, style.",
  },
  {
    icon: Tags,
    title: "Metadata",
    description:
      "Title, description, and 30–50 keywords tuned for Shutterstock & Adobe Stock.",
  },
  {
    icon: Layers,
    title: "Batch Variants",
    description:
      "Render multi aspect-ratio variants (16:9, 1:1, 9:16, 4:5) in one pass.",
  },
];

export function MicrostockPage() {
  return (
    <PageShell
      title="Microstock"
      description="Toolkit khusus kreator microstock. Dari ide sampai metadata siap upload."
      badge="M9 · coming soon"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="transition-transform hover:-translate-y-0.5">
            <CardHeader>
              <div className="mb-3 grid size-10 place-items-center rounded-[var(--radius-md)] gradient-accent shadow-[var(--shadow-glow)]">
                <Icon className="size-5 text-white" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
