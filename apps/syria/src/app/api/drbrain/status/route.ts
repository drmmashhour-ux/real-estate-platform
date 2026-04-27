import { runSyriaDrBrainReportReadOnly } from "@/lib/drbrain";

export const dynamic = "force-dynamic";

/**
 * Aggregate DR.BRAIN rollup status — no payloads, secrets, or individual records.
 */
export async function GET() {
  try {
    const report = await runSyriaDrBrainReportReadOnly();
    return Response.json({ status: report.status });
  } catch {
    return Response.json({ status: "CRITICAL" }, { status: 503 });
  }
}
