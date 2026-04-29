import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActivationPrompt } from "../../../../../modules/brokers/activation.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brokerId = searchParams.get("brokerId");

    if (!brokerId) {
      return NextResponse.json({ error: "Missing brokerId" }, { status: 400 });
    }

    const activation = await prisma.brokerActivation.findUnique({
      where: { brokerId },
    });

    if (!activation) {
      // Return first step nudge if no activation record exists yet
      return NextResponse.json({
        nudge: {
          title: "Bienvenue !",
          message: "Commencez par créer votre premier draft pour sécuriser votre transaction.",
          cta: "Démarrer",
          link: "/drafts/turbo",
          milestone: "createdDraft"
        }
      });
    }

    const nudge = getActivationPrompt(activation);

    // Add final conversion nudge if everything else is done
    if (!nudge && activation.completedDraft && !activation.firstPayment) {
      return NextResponse.json({
        nudge: {
          title: "Document prêt !",
          message: "Continuez avec vos prochains dossiers — paiement à l’usage.",
          cta: "Finaliser & Payer",
          link: "/drafts",
          milestone: "firstPayment"
        }
      });
    }

    return NextResponse.json({ nudge });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
