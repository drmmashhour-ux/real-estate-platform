import { NextResponse } from "next/server";

/**
 * Finance API index — tenant-scoped routes live under `/api/finance/*` (session + workspace cookie / `x-tenant-id`).
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    dashboard: "/dashboard/finance",
    routes: [
      "GET/POST /api/finance/deals",
      "GET/PATCH /api/finance/deals/[id]",
      "POST /api/finance/deals/[id]/splits",
      "GET/POST /api/finance/invoices",
      "GET/PATCH /api/finance/invoices/[id]",
      "POST /api/finance/invoices/[id]/issue | mark-paid | cancel",
      "GET/POST /api/finance/payments",
      "GET/PATCH /api/finance/payments/[id]",
      "GET /api/finance/analytics/overview | timeseries",
    ],
    note: "Platform subscription billing remains under `/api/billing/*` and `/api/monetization/*`.",
  });
}
