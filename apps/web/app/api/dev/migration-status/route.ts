import { migrationStatus } from "@/lib/db/migrationStatus";

export const dynamic = "force-dynamic";

/**
 * Order 92 — which route areas target marketplace vs monolith. Disabled in production unless
 * `MIGRATION_STATUS_API=1` (e.g. internal dashboards).
 */
export async function GET() {
  if (process.env.NODE_ENV === "production" && process.env.MIGRATION_STATUS_API !== "1") {
    return new Response("Not found", { status: 404 });
  }
  return Response.json(migrationStatus);
}
