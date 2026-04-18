import { commandCenterFlags } from "@/config/feature-flags";
import { CommandCenterLayout } from "@/components/command-center/CommandCenterLayout";
import { IpSecurityGovernanceBlock } from "@/components/command-center/IpSecurityGovernanceBlock";
import { buildCommandCenterPayload } from "@/modules/command-center/command-center.service";
import { parseAdminRange } from "@/modules/analytics/services/admin-analytics-service";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function flattenSearchParams(sp: Record<string, string | string[] | undefined>): Record<string, string | undefined> {
  const o: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) {
    o[k] = typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  }
  return o;
}

export default async function CommandCenterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminControlUserId();
  const sp = await searchParams;
  const flat = flattenSearchParams(sp);

  if (!commandCenterFlags.commandCenterV1) {
    return (
      <CommandCenterLayout
        title="Command center"
        subtitle="Enable FEATURE_COMMAND_CENTER_V1 to load internal metrics and insights."
      >
        <p className="text-sm text-ds-text-secondary">
          This surface is gated by environment flag. No data is shown until enabled by platform ops.
        </p>
      </CommandCenterLayout>
    );
  }

  const range = parseAdminRange({
    range: flat.range ?? null,
    from: flat.from ?? null,
    to: flat.to ?? null,
  });
  const params = new URLSearchParams();
  params.set("from", range.from);
  params.set("to", range.to);
  if (range.preset === "7d") params.set("days", "7");
  else if (range.preset === "90d") params.set("days", "90");
  else params.set("days", "30");
  if (flat.city?.trim()) params.set("city", flat.city.trim());

  const data = await buildCommandCenterPayload(params);
  return (
    <CommandCenterLayout data={data} searchParams={flat}>
      <IpSecurityGovernanceBlock />
    </CommandCenterLayout>
  );
}
