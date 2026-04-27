import { z } from "zod";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { createInvestorLead } from "@/lib/investor/outreachEngine";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().trim().max(256).optional().nullable(),
  email: z
    .string()
    .trim()
    .max(320)
    .optional()
    .nullable()
    .refine((v) => v == null || v === "" || z.string().email().safeParse(v).success, "Invalid email"),
  status: z.enum(["new", "contacted", "replied", "meeting", "closed"]).optional(),
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

  const { name, email, status } = parsed.data;
  const r = await createInvestorLead({
    name: name ?? null,
    email: email && email.length > 0 ? email : null,
    status,
  });
  if (!r.ok) {
    return Response.json({ ok: false, error: r.error, code: r.code }, { status: 500 });
  }

  return Response.json({ ok: true, id: r.id });
}
