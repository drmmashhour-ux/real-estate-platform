import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getAdminPayoutRows } from "@/lib/admin/payouts-loader";

export const dynamic = "force-dynamic";

function cell(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const s = await requireAdminSession();
  if (!s.ok) {
    return NextResponse.json({ error: s.error }, { status: s.status });
  }

  const rows = await getAdminPayoutRows(5000);
  const header = [
    "payout_id",
    "host_email",
    "booking_ref",
    "gross_cents",
    "fee_cents",
    "net_cents",
    "status",
    "created_at",
    "released_at",
  ].join(",");

  const lines = [header];
  for (const r of rows) {
    lines.push(
      [
        cell(r.id),
        cell(r.hostEmail ?? ""),
        cell(r.bookingRef ?? ""),
        String(r.grossCents),
        String(r.feeCents),
        String(r.netCents),
        cell(r.status),
        r.createdAt.toISOString(),
        r.releasedAt?.toISOString() ?? "",
      ].join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="lecipm-admin-payouts.csv"',
    },
  });
}
