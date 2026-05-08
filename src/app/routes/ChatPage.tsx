import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "./_PageShell";

export function ChatPage() {
  return (
    <PageShell
      title="Chat"
      description="Multi-provider AI assistant. Switch between OpenAI, Mistral, OpenRouter, or a custom endpoint."
      badge="M3 · coming soon"
    >
      <Card>
        <CardHeader>
          <CardTitle>Stub</CardTitle>
          <CardDescription>
            Streaming chat UI, history, markdown rendering, and code blocks will
            be wired up in Milestone M3 and M5.
          </CardDescription>
        </CardHeader>
      </Card>
    </PageShell>
  );
}
