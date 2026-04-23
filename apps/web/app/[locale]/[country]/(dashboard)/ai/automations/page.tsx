import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { syncAutomationRuleDefinitions } from "@/lib/ai/actions/automation-engine";
import { AutomationsClient } from "./automations-client";

export default async function AiAutomationsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/ai/automations");
  if (!(await isPlatformAdmin(userId))) redirect("/ai");

  await syncAutomationRuleDefinitions();
  const rules = await prisma.managerAiAutomationRule.findMany({ orderBy: { key: "asc" } });

  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-white">Automations</h1>
      <p className="mb-6 text-sm text-white/50">Idempotent rules — enable/disable and run on demand.</p>
      <AutomationsClient
        rules={rules.map((r) => ({
          ...r,
          lastRunAt: r.lastRunAt ? r.lastRunAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
