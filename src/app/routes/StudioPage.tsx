import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "./_PageShell";

export function StudioPage() {
  return (
    <PageShell
      title="Studio"
      description="Remotion-powered video studio. Live preview at 4K · 30fps by default."
      badge="M6 · coming soon"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Scenes</CardTitle>
            <CardDescription>
              Scene list + AI prompt panel will live here.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="min-h-[360px]">
          <CardHeader>
            <CardTitle className="text-sm">Live Preview</CardTitle>
            <CardDescription>
              &lt;Player /&gt; from @remotion/player will mount here. Default
              composition: 3840 × 2160 @ 30fps.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Inspector</CardTitle>
            <CardDescription>
              Props editor, transitions, and render preset controls.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </PageShell>
  );
}
