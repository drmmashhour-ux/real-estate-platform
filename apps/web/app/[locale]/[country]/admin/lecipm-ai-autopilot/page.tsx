import Link from "next/link";
import { notFound } from "next/navigation";
import { aiAutopilotV1Flags } from "@/config/feature-flags";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { AutopilotDashboard } from "@/components/ai-autopilot/AutopilotDashboard";
import { AutopilotQueueHealth } from "@/components/ai-autopilot/AutopilotQueueHealth";

export const dynamic = "force-dynamic";

export default async function AdminLecipmAiAutopilotPage() {
  await requireAdminControlUserId();
  if (!aiAutopilotV1Flags.aiAutopilotV1) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 text-white">
      <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Admin
      </Link>
      <div>
        <h1 className="text-2xl font-bold">AI Autopilot — platform view</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Admins see the full <code className="text-zinc-500">platform_autopilot_actions</code> queue. No auto-changes to fraud, ranking, or
          payments from this surface.
        </p>
      </div>
      <AutopilotQueueHealth />
      <AutopilotDashboard />
    </div>
  );
}
