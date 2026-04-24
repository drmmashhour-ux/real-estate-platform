import type { BrokerAssistantContext, DraftingSuggestion } from "@/modules/broker-assistant/broker-assistant.types";

/**
 * French-first drafting scaffolds with explicit placeholders — no invented facts.
 */
export function buildDraftingSuggestions(ctx: BrokerAssistantContext): DraftingSuggestion[] {
  const out: DraftingSuggestion[] = [];
  const buyer = ctx.parties.find((p) => p.role === "buyer")?.fullName ?? "[NOM_ACHETEUR]";
  const seller = ctx.parties.find((p) => p.role === "seller")?.fullName ?? "[NOM_VENDEUR]";
  const addr =
    [ctx.listing?.addressLine, ctx.listing?.city, ctx.listing?.postalCode].filter(Boolean).join(", ") ||
    "[ADRESSE_COMPLETE]";

  if (ctx.documentType === "promise_to_purchase" || ctx.documentType === "counter_offer") {
    out.push({
      id: "draft_promise_header",
      titleFr: "Objet — promesse d’achat résidentielle (ébauche)",
      bodyFr: `Les soussigné(e)s conviennent que l’acheteur ${buyer} s’engage à acquérir et le vendeur ${seller} s’engage à vendre l’immeuble situé au ${addr}, sous réserve des conditions à préciser et de l’approbation du courtier responsable.`,
      bodyEn: `The undersigned agree that buyer ${buyer} undertakes to acquire and seller ${seller} undertakes to sell the property at ${addr}, subject to conditions to be specified and approval by the responsible broker.`,
      placeholdersUsed: ["buyer", "seller", "address", "conditions"],
    });
  }

  if (ctx.documentType === "email" || ctx.documentType === "note") {
    out.push({
      id: "draft_client_followup",
      titleFr: "Suivi client — prochaines étapes (FR)",
      bodyFr: `Bonjour,\n\nVoici un rappel des prochaines étapes pour le dossier concernant ${addr}. Les échéances et conditions définitives seront confirmées par votre courtier.\n\nCordialement,\n${ctx.broker?.displayName ?? "[NOM_COURTIER]"}`,
      bodyEn: `Hello,\n\nHere is a reminder of next steps for the file regarding ${addr}. Deadlines and final conditions will be confirmed by your broker.\n\nRegards,\n${ctx.broker?.displayName ?? "[BROKER_NAME]"}`,
      placeholdersUsed: ["address", "brokerName"],
    });
  }

  if (ctx.fsboContext) {
    out.push({
      id: "draft_fsbo_neutral",
      titleFr: "Mode FSBO — formulation neutre",
      bodyFr:
        "Ce message est fourni à titre informatif. La plateforme n’agit pas comme courtier ; toute décision relève des parties et, le cas échéant, d’un professionnel mandaté.",
      bodyEn:
        "This message is informational. The platform does not act as broker; decisions rest with the parties and any mandated professional.",
      placeholdersUsed: [],
    });
  }

  return out;
}
