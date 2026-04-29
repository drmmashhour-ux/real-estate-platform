import { prisma } from "@/lib/db";
import { sendBrokerAfterDemo } from "../lib/email/broker-outreach-emails";

export type ActivationMilestone = "createdDraft" | "usedAI" | "completedDraft" | "firstPayment";

export async function trackBrokerActivation(brokerId: string, milestone: ActivationMilestone) {
  try {
    const activation = await prisma.brokerActivation.upsert({
      where: { brokerId },
      update: {
        [milestone]: true,
      },
      create: {
        brokerId,
        [milestone]: true,
      },
    });

    // Auto-update the lead status if it exists
    const broker = await prisma.user.findUnique({
      where: { id: brokerId },
      select: { email: true, name: true }
    });

    if (broker?.email) {
      const statusMap: Record<ActivationMilestone, string> = {
        createdDraft: "trial_started",
        usedAI: "trial_started", // keep as trial_started but with more progress
        completedDraft: "first_deal",
        firstPayment: "onboarded"
      };

      await prisma.brokerOnboardingLead.updateMany({
        where: { email: broker.email },
        data: { status: statusMap[milestone] }
      });
    }

    // If they just completed their first draft, send a retention email
    if (milestone === "completedDraft") {
      if (broker?.email) {
        await sendBrokerSuccessEmail(broker.email, broker.name || "Courtier");
      }
    }

    return activation;
  } catch (error) {
    console.error("[ACTIVATION_TRACKING]", error);
    return null;
  }
}

async function sendBrokerSuccessEmail(to: string, name: string) {
  const { sendEmail } = await import("../lib/email/send");
  return sendEmail({
    to,
    subject: "Ton premier document est prêt — continue avec LECIPM",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h2 style="color: #D4AF37;">Félicitations !</h2>
        <p>Bonjour ${name},</p>
        <p>Votre premier document a été généré avec succès sur LECIPM.</p>
        <p>Vous avez maintenant vu comment le système sécurise votre rédaction et vous fait gagner un temps précieux.</p>
        <p>Continuez sur votre lancée pour vos prochains dossiers :</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="https://lecipm.com/drafts/turbo" style="background: #D4AF37; color: black; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Créer un nouveau dossier</a>
        </p>
        <p>Notre équipe reste disponible si vous avez besoin d'accompagnement.</p>
        <p style="margin-top: 40px; font-weight: bold;">L'équipe LECIPM Québec</p>
      </div>
    `
  });
}

export function getActivationPrompt(state: any) {
  if (!state.createdDraft) {
    return {
      title: "Prêt à commencer ?",
      message: "Créez votre première offre en 2 minutes avec notre assistant guidé.",
      cta: "Créer un draft",
      link: "/drafts/turbo"
    };
  }
  if (!state.usedAI) {
    return {
      title: "Sécurisez votre dossier",
      message: "Essayez l’analyse IA pour détecter les risques dans vos clauses.",
      cta: "Lancer l'analyse",
      link: "/drafts/turbo"
    };
  }
  if (!state.firstPayment) {
    return {
      title: "Finalisez votre document",
      message: "Téléchargez la version finale prête pour signature.",
      cta: "Finaliser maintenant",
      link: "/drafts"
    };
  }
  return null;
}
