import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { sanitizeRevenuQuebecProfileForBrokerUI } from "@/lib/financial/revenu-quebec-profile";
import { resolveFinancialRegistryScope } from "@/lib/financial/registry-api-scope";

export const dynamic = "force-dynamic";

const postBodySchema = z.object({
  ownerType: z.string().min(1),
  ownerId: z.string().min(1),
});

/** POST /api/financial/revenu-quebec-profile — load profile (masked raw identifiers for all viewers). */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof postBodySchema>;
  try {
    body = postBodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const scope = await resolveFinancialRegistryScope(auth.user, body);
  if (scope instanceof NextResponse) return scope;

  const profile = await prisma.revenuQuebecProfile.findUnique({
    where: {
      ownerType_ownerId: {
        ownerType: scope.ownerType,
        ownerId: scope.ownerId,
      },
    },
  });

  const sanitized = sanitizeRevenuQuebecProfileForBrokerUI(profile);

  return NextResponse.json({ success: true, profile: sanitized });
}
