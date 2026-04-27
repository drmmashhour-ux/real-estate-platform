import { z } from "zod";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { sendInvestorMessage } from "@/lib/investor/outreachEngine";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  investorId: z.string().uuid(),
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

  const r = await sendInvestorMessage(parsed.data.investorId);
  if (!r.ok) {
    return Response.json(
      { ok: false, error: r.error, code: r.code },
      { status: r.code === "not_found" ? 404 : 500 }
    );
  }

  return Response.json({ ok: true, message: r.message, outreachId: r.outreachId });
}
