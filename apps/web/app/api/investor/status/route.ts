import { z } from "zod";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { updateInvestorStatus } from "@/lib/investor/outreachEngine";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  investorId: z.string().uuid(),
  status: z.enum(["new", "contacted", "replied", "meeting", "closed"]),
});

export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ ok: false, error: admin.error }, { status: admin.status });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const r = await updateInvestorStatus(parsed.data.investorId, parsed.data.status);
  if (!r.ok) {
    return Response.json(
      { ok: false, error: r.error, code: r.code },
      { status: r.code === "not_found" ? 404 : r.code === "invalid_status" ? 400 : 500 }
    );
  }

  return Response.json({ ok: true });
}
