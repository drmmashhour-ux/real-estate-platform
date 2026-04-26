import { runLaunchChecks } from "@/lib/launch/checks";

export const dynamic = "force-dynamic";

/**
 * GET /api/launch/config-status — env-only go/no-go (`DATABASE_URL`, `STRIPE_SECRET_KEY`).
 * For the full launch checklist, use `GET /api/launch/status` (requires launch-system auth + flag).
 */
export async function GET() {
  return Response.json(runLaunchChecks());
}
