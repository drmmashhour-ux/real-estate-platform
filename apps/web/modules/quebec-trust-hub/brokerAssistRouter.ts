export interface BrokerAssistRequest {
  draftId: string;
  userId?: string;
  reasonFr?: string;
  status: "REQUESTED" | "ACCEPTED" | "COMPLETED";
}

export async function shouldSuggestBrokerAssist(context: any): Promise<boolean> {
  const { representedStatus, resultJson } = context;
  
  if (representedStatus === "NOT_REPRESENTED") return true;

  const risks = resultJson?.risks || [];
  const criticalRisks = risks.filter((r: any) => r.severity === "CRITICAL");
  if (criticalRisks.length > 0) return true;

  return false;
}

export function generateBrokerAssistReason(context: any): string {
  const { representedStatus, resultJson } = context;
  if (representedStatus === "NOT_REPRESENTED") {
    return "En tant qu'acheteur non représenté, vous bénéficiez d'un traitement équitable, mais une révision par un courtier dédié protégerait vos intérêts.";
  }
  
  const risks = resultJson?.risks || [];
  const criticalRisks = risks.filter((r: any) => r.severity === "CRITICAL");
  if (criticalRisks.length > 0) {
    return "Votre document contient des clauses à risque élevé qui nécessitent une validation professionnelle.";
  }

  return "Une révision professionnelle sécurise votre transaction.";
}
