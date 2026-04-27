import { getExperimentResults } from "@/lib/experiments/engine";
import { requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

/**
 * Read-only results + winner hint (advisory; no automatic product changes). Admin only.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }

  const { key } = await params;
  const results = await getExperimentResults(decodeURIComponent(key));
  if (!results) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json(results, { headers: { "Cache-Control": "private, no-store" } });
}
