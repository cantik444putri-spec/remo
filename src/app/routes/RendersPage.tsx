import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageShell } from "./_PageShell";

export function RendersPage() {
  return (
    <PageShell
      title="Renders"
      description="Antrian render Remotion dengan progress dan ETA real-time."
      badge="M8 · coming soon"
    >
      <Card>
        <CardHeader>
          <CardTitle>Queue is empty</CardTitle>
          <CardDescription>
            Buat project di Studio, lalu klik Render untuk mengantrikan job.
            Default preset: 4K UHD · 30fps · H.264 · CRF 18.
          </CardDescription>
        </CardHeader>
      </Card>
    </PageShell>
  );
}
