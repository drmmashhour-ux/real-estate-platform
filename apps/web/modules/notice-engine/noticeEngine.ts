export type DraftContext = {
  hasWarrantyExclusion?: boolean;
  buyerRepresented?: boolean;
  inclusionsModified?: boolean;
  containsPersonalData?: boolean;
};

export type NoticeSeverity = "INFO" | "WARNING" | "CRITICAL";
export type NoticeType = "REPRESENTATION" | "WARRANTY" | "TRANSPARENCY" | "PRIVACY" | "RISK";

export type DetectedNotice = {
  type: NoticeType;
  title: string;
  content: string;
  severity: NoticeSeverity;
};

export function detectNotices(ctx: DraftContext): DetectedNotice[] {
  const notices: DetectedNotice[] = [];

  if (ctx.hasWarrantyExclusion) {
    notices.push({
      type: "WARRANTY",
      title: "⚠️ Exclusion de garantie légale",
      content:
        "Cette transaction exclut la garantie légale. L’acheteur renonce à certains recours en vices cachés. Il est recommandé de bien comprendre les conséquences et de consulter un professionnel.",
      severity: "CRITICAL",
    });
  }

  if (ctx.buyerRepresented === false) {
    notices.push({
      type: "REPRESENTATION",
      title: "ℹ️ Absence de représentation",
      content:
        "Le courtier agit exclusivement pour le vendeur. Il est recommandé à l’acheteur de se faire représenter afin de protéger ses intérêts.",
      severity: "WARNING",
    });
  }

  if (ctx.inclusionsModified) {
    notices.push({
      type: "TRANSPARENCY",
      title: "📋 Inclusions et exclusions",
      content:
        "Les inclusions et exclusions doivent être clairement définies afin d’éviter toute ambiguïté ou litige entre les parties.",
      severity: "WARNING",
    });
  }

  if (ctx.containsPersonalData) {
    notices.push({
      type: "PRIVACY",
      title: "🔒 Protection des renseignements personnels",
      content:
        "Les renseignements personnels doivent être traités conformément à la Loi 25. Assurez-vous du consentement des parties avant toute transmission.",
      severity: "CRITICAL",
    });
  }

  return notices;
}
