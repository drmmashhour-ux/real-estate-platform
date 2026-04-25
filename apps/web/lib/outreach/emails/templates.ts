/**
 * Automated Email Sequence for Broker Onboarding
 * Tone: Professional, High-Efficiency, Québec-focused
 */

export const BROKER_EMAILS = {
  CONFIRMATION: {
    subject: "Confirmation de votre démo LECIPM",
    body: (name: string, date: string) => `
Bonjour ${name},

Votre démo LECIPM est confirmée pour le ${date}.

C'est une session rapide de 10 minutes pour vous montrer comment sécuriser vos transactions et automatiser vos formulaires OACIQ.

EN ATTENDANT:
Vous pouvez voir un aperçu de 2 minutes ici:
https://lecipm.ca/demo/broker

À très bientôt,
L'équipe LECIPM
    `
  },
  REMINDER_24H: {
    subject: "Rappel: votre démo LECIPM demain",
    body: (name: string) => `
Bonjour ${name},

Petit rappel pour notre échange de demain. 

Nous allons voir comment LECIPM peut vous faire gagner environ 2h par offre tout en réduisant vos risques de conformité.

Lien de connexion: [Lien Zoom/Google Meet]

Bonne journée!
    `
  },
  REMINDER_1H: {
    subject: "On se voit dans 1 heure (Démo LECIPM)",
    body: () => `
C'est presque l'heure!

Je suis prêt à vous montrer le système. À tout de suite sur le lien ci-dessous:
[Lien de connexion]
    `
  },
  NO_SHOW: {
    subject: "On s'est manqués ?",
    body: (name: string) => `
Bonjour ${name},

Je n'ai pas pu vous joindre pour notre démo prévue tout à l'heure. 

Je sais que l'agenda d'un courtier est imprévisible. Vous pouvez replanifier en un clic ici quand vous aurez un moment:
https://lecipm.ca/book-demo

Bonne fin de journée!
    `
  },
  POST_DEMO: {
    subject: "Voici comment commencer avec LECIPM",
    body: (name: string) => `
Merci pour votre temps aujourd'hui ${name}.

Comme promis, voici le lien pour créer votre compte courtier et commencer à utiliser la rédaction intelligente:
https://lecipm.ca/onboarding/broker

      Si vous avez des questions sur l'intégration avec votre agence, je suis là.
    `
  },
  RETENTION_FIRST_DOC: {
    subject: "Ton premier document est prêt — continue avec LECIPM",
    body: (name: string) => `
Félicitations ${name} !

Tu viens de finaliser ton premier document sur LECIPM. C'est une étape clé pour sécuriser ton activité et gagner en efficacité.

N'oublie pas : chaque document suivant bénéficie de la même intelligence et validation OACIQ. 

Prêt pour le prochain dossier ?
https://lecipm.ca/drafts/turbo

Bonne continuation,
L'équipe LECIPM
    `
  }
};
