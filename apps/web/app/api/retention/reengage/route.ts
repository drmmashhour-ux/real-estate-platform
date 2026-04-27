import { prepareReengagementBatch, sendReengagementToUsers } from "@/lib/retention/engine";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { trackEvent } from "@/src/services/analytics";

export const dynamic = "force-dynamic";

type Body = { dryRun?: boolean; userIds?: string[] };

/**
 * Order 58 — re-engagement. **Default `dryRun: true`**: returns prepared batch only (no send, no rate-cap update).
 * `dryRun: false` with `userIds` runs stub send + audit log for selected users that are still batch-eligible.
 */
export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* empty body */
  }

  const dryRun = body.dryRun !== false;

  if (dryRun) {
    const batch = await prepareReengagementBatch();
    void trackEvent("reengagement_prepared", { count: batch.length }, { userId: admin.userId });
    return Response.json({ batch }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const userIds = Array.isArray(body.userIds) ? body.userIds.filter((id) => typeof id === "string" && id.length > 0) : [];
  if (userIds.length === 0) {
    return Response.json({ error: "userIds is required when dryRun is false" }, { status: 400 });
  }

  const { results } = await sendReengagementToUsers(userIds, { adminUserId: admin.userId });
  return Response.json({ results }, { headers: { "Cache-Control": "private, no-store" } });
}
