import { sendEmail } from "./send";

export async function sendBrokerBookingConfirmation(to: string, name: string, scheduledAt: Date) {
  const dateStr = scheduledAt.toLocaleDateString('fr-CA', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const loomLink = "https://lecipm.com/demo/broker";

  return sendEmail({
    to,
    subject: "Confirmation de votre démo LECIPM",
    type: "booking_confirmation",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h2 style="color: #D4AF37;">Confirmation de votre démo</h2>
        <p>Bonjour ${name},</p>
        <p>C'est confirmé ! Votre démo personnalisée de LECIPM est prévue pour :</p>
        <p style="font-size: 18px; font-weight: bold; background: #f9f9f9; padding: 15px; border-radius: 8px; text-align: center;">
          ${dateStr}
        </p>
        <p>En attendant notre rencontre, vous pouvez jeter un coup d'œil à cet aperçu rapide (2 minutes) :</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${loomLink}" style="background: #D4AF37; color: black; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Voir l'aperçu (Loom)</a>
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 14px; color: #666;">
          <strong>Rappel :</strong> Cette session dure 10 minutes. Nous allons nous concentrer sur la réduction du temps de rédaction et la validation intelligente des formulaires.
        </p>
        <p style="font-size: 14px; color: #666;">
          Si vous avez un empêchement, merci de nous prévenir au moins 2 heures à l'avance.
        </p>
        <p style="margin-top: 40px; font-weight: bold;">L'équipe LECIPM Québec</p>
      </div>
    `
  });
}

export async function sendBrokerReminder24h(to: string, name: string) {
  return sendEmail({
    to,
    subject: "As-tu eu le temps d’essayer ? Je peux t’aider sur un vrai dossier.",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <p>Bonjour ${name},</p>
        <p>C'est un petit rappel pour savoir si vous avez eu l'occasion de tester LECIPM depuis notre démo d'hier.</p>
        <p>Si vous avez un dossier réel en cours, je peux vous guider pour votre premier draft (ça prend 5-10 minutes).</p>
        <p><a href="https://lecipm.com/drafts/turbo" style="color: #D4AF37; font-weight: bold;">Lancer mon premier draft</a></p>
        <p>À bientôt !</p>
        <p style="font-weight: bold;">L'équipe LECIPM Québec</p>
      </div>
    `
  });
}

export async function sendBrokerReminder48h(to: string, name: string) {
  return sendEmail({
    to,
    subject: "On peut tester ensemble sur un cas réel (5–10 min).",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <p>Bonjour ${name},</p>
        <p>Je reviens vers vous car le vrai test de LECIPM se fait sur un dossier concret.</p>
        <p>Avez-vous une promesse d'achat ou un contrat de courtage à rédiger cette semaine ?</p>
        <p>On peut le faire ensemble en direct pour que vous voyiez la puissance de la validation intelligente.</p>
        <p><a href="https://lecipm.com/book-demo" style="color: #D4AF37; font-weight: bold;">Prendre 10 minutes d'accompagnement</a></p>
        <p style="font-weight: bold;">L'équipe LECIPM Québec</p>
      </div>
    `
  });
}

export async function sendBrokerReminder72h(to: string, name: string) {
  return sendEmail({
    to,
    subject: "LECIPM dossier par dossier, sans engagement.",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <p>Bonjour ${name},</p>
        <p>Juste un dernier mot pour vous rappeler que LECIPM est disponible sans abonnement mensuel.</p>
        <p>Vous payez uniquement lorsque vous finalisez un dossier. C'est l'outil parfait pour sécuriser vos transactions les plus complexes sans augmenter vos frais fixes.</p>
        <p><a href="https://lecipm.com/onboarding/broker" style="color: #D4AF37; font-weight: bold;">Activer mon accès</a></p>
        <p style="font-weight: bold;">L'équipe LECIPM Québec</p>
      </div>
    `
  });
}

export async function sendBrokerReminder1h(to: string, name: string) {
  return sendEmail({
    to,
    subject: "On se voit dans 1 heure",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <p>Bonjour ${name},</p>
        <p>On se voit dans une heure pour votre démo LECIPM.</p>
        <p>Préparez vos questions !</p>
        <p style="font-weight: bold;">L'équipe LECIPM Québec</p>
      </div>
    `
  });
}

export async function sendBrokerNoShow(to: string, name: string) {
  return sendEmail({
    to,
    subject: "On peut replanifier en 1 clic",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <p>Bonjour ${name},</p>
        <p>Désolé que nous nous soyons manqués aujourd'hui.</p>
        <p>Nous savons que l'agenda d'un courtier est chargé. Vous pouvez replanifier votre démo de 10 minutes en cliquant ici :</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="https://lecipm.com/book-demo" style="background: #D4AF37; color: black; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Replanifier ma démo</a>
        </p>
        <p style="font-weight: bold;">L'équipe LECIPM Québec</p>
      </div>
    `
  });
}

export async function sendBrokerAfterDemo(to: string, name: string) {
  return sendEmail({
    to,
    subject: "Voici comment commencer avec LECIPM",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <p>Bonjour ${name},</p>
        <p>Merci pour votre temps aujourd'hui.</p>
        <p>Voici le lien pour activer votre compte et commencer votre premier draft :</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="https://lecipm.com/auth/onboarding" style="background: #D4AF37; color: black; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Commencer maintenant</a>
        </p>
        <p>Si vous avez des questions, je suis là.</p>
        <p style="font-weight: bold;">L'équipe LECIPM Québec</p>
      </div>
    `
  });
}
