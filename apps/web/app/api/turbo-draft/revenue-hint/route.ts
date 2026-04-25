import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";

/**
 * Surfaces in-product upsell / education copy for the LECIPM pay-per-export revenue flow.
 * After 1st draft: pay-per-use nudge. After 2–3: pack CTA.
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const count = await prisma.turboDraft.count({ where: { userId: auth.user.id } });

  if (count === 1) {
    return NextResponse.json({
      hint: {
        id: "first_draft",
        title: "Paiement à l’usage",
        body: "Continuez avec votre prochain dossier — vous payez seulement quand vous exportez le PDF.",
        variant: "info" as const,
      },
    });
  }

  if (count >= 2 && count <= 3) {
    return NextResponse.json({
      hint: {
        id: "pack_upsell",
        title: "Économisez avec 10 utilisations",
        body: "Un pack 10 crédits réduit le coût par export — idéal quand le turbo-draft devient votre routine.",
        variant: "promo" as const,
      },
    });
  }

  return NextResponse.json({ hint: null, draftCount: count });
}
