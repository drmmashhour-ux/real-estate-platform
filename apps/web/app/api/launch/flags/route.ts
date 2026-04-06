import { resolveLaunchFlags } from "@/lib/launch/resolve-launch-flags";

export const dynamic = "force-dynamic";

/** Public launch flags (no secrets) — merged env + DB `launch:*` feature flags. */
export async function GET() {
  const flags = await resolveLaunchFlags();
  return Response.json(flags);
}
