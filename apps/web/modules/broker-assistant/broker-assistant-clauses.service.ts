import { prisma } from "@/lib/db";
import type { BrokerAssistantContext, SuggestedClauseRef } from "@/modules/broker-assistant/broker-assistant.types";

/**
 * Suggests clause categories from context — integrates with clause library when available.
 * Never inserts clauses automatically.
 */
export async function suggestClauseCategoriesForContext(ctx: BrokerAssistantContext): Promise<SuggestedClauseRef[]> {
  const out: SuggestedClauseRef[] = [];

  if (ctx.documentType === "promise_to_purchase" || ctx.documentType === "counter_offer") {
    out.push({
      categoryCode: "promise_to_purchase",
      titleFr: "Promesse d’achat — clauses types",
      rationaleFr:
        "Le moteur de clauses normalisées peut proposer des modèles pour délais, conditions et notifications — révision obligatoire par le courtier.",
      rationaleEn:
        "The standardized clause engine may offer templates for deadlines, conditions, and notices — broker review required.",
      requiresBrokerReview: true,
    });
  }

  if (ctx.conditions?.financing?.present) {
    out.push({
      categoryCode: "financing_condition",
      titleFr: "Condition de financement",
      rationaleFr: "Documentez l’échéance, les prêteurs visés et les effets en cas de non-satisfaction.",
      rationaleEn: "Document the deadline, intended lenders, and effects if not satisfied.",
      requiresBrokerReview: true,
    });
  }

  if (ctx.conditions?.inspection?.present || ctx.documentType === "promise_to_purchase") {
    out.push({
      categoryCode: "inspection",
      titleFr: "Inspection / état du bâtiment",
      rationaleFr: "Prévoir délai, périmètre et conséquences; éviter les formulations ambiguës.",
      rationaleEn: "Set deadline, scope, and consequences; avoid ambiguous wording.",
      requiresBrokerReview: true,
    });
  }

  if (ctx.disclosures?.brokerHasInterest || ctx.conflict?.conflictIndicated) {
    out.push({
      categoryCode: "conflict_disclosure",
      titleFr: "Divulgation — conflit d’intérêts",
      rationaleFr: "Une divulgation écrite et l’approbation du courtier responsable sont requises avant de poursuivre.",
      rationaleEn: "Written disclosure and responsible broker approval are required before proceeding.",
      requiresBrokerReview: true,
    });
  }

  try {
    const count = await prisma.clausesLibrary.count({ where: { active: true } });
    if (count > 0) {
      out.push({
        categoryCode: "library",
        titleFr: "Bibliothèque de clauses LECIPM",
        rationaleFr: `La bibliothèque contient des clauses actives — comparez avec votre brouillon (${count} entrées indexées).`,
        rationaleEn: `The clause library has active entries — compare with your draft (${count} indexed).`,
        requiresBrokerReview: true,
      });
    }
  } catch {
    /* prisma optional in tests */
  }

  return out;
}
