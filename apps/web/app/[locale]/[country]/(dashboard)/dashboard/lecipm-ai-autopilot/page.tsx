import Link from "next/link";
import { notFound } from "next/navigation";
import { aiAutopilotV1Flags } from "@/config/feature-flags";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { AutopilotDashboard } from "@/components/ai-autopilot/AutopilotDashboard";

export const dynamic = "force-dynamic";

export default async function LecipmAiAutopilotDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  await requireAuthenticatedUser();
  if (!aiAutopilotV1Flags.aiAutopilotV1) {
    notFound();
  }
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 text-white">
      <Link href={base} className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Dashboard
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">LECIPM AI Autopilot v1</p>
        <h1 className="mt-2 text-2xl font-bold">Unified queue</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Detect → recommend → approve → safe execute. Does not replace listing optimization, deal autopilot, or BNHub host
          settings — it aggregates visibility and audit rows.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Existing: <Link href={`${base}/autopilot`} className="text-emerald-400 hover:underline">Listing autopilot</Link> ·{" "}
          <Link href={`${base}/crm/autopilot`} className="text-emerald-400 hover:underline">CRM autopilot</Link>
        </p>
      </div>
      <AutopilotDashboard />
    </div>
  );
}
