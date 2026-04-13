import { getGuestId } from "@/lib/auth/session";
import { getOrCreateHostAutopilotSettings } from "@/lib/host/autopilot-settings";
import { AutopilotSettingsForm } from "./AutopilotSettingsForm";

export const dynamic = "force-dynamic";

export default async function HostAutopilotPage() {
  const hostId = await getGuestId();
  if (!hostId) return null;

  const settings = await getOrCreateHostAutopilotSettings(hostId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Autopilot</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Control how AI suggests prices, promotions, and listing tweaks. Approval required when enabled below.
        </p>
      </div>
      <AutopilotSettingsForm initial={settings} />
    </div>
  );
}
