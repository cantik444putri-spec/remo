import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageShell } from "./_PageShell";

export function SettingsPage() {
  return (
    <PageShell
      title="Settings"
      description="Tema, akselerasi hardware, default preset render, Remotion license key, dan shortcuts."
      badge="M10 · coming soon"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Dark (default), OLED true-black, accent color. Mica/Acrylic akan
              aktif otomatis di Windows 11.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Remotion License</CardTitle>
            <CardDescription>
              Free license untuk individu & perusahaan ≤3 orang. Tempel Company
              License Key di sini jika Anda membeli.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </PageShell>
  );
}
