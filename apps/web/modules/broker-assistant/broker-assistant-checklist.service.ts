import type { BrokerAssistantContext, MissingInformationItem } from "@/modules/broker-assistant/broker-assistant.types";

function mi(
  id: string,
  fieldKey: string,
  messageFr: string,
  messageEn: string,
  severity: MissingInformationItem["severity"],
): MissingInformationItem {
  return { id, fieldKey, messageFr, messageEn, severity };
}

/**
 * Deterministic missing-information detection for Québec residential workflows.
 */
export function detectMissingInformation(ctx: BrokerAssistantContext): MissingInformationItem[] {
  const out: MissingInformationItem[] = [];

  const buyerName = ctx.parties.find((p) => p.role === "buyer")?.fullName?.trim();
  const sellerName = ctx.parties.find((p) => p.role === "seller")?.fullName?.trim();
  const addr =
    [ctx.listing?.addressLine, ctx.listing?.city, ctx.listing?.postalCode].filter(Boolean).join(", ").trim();

  if (!buyerName && ctx.transactionMode !== "fsbo_neutral") {
    out.push(
      mi(
        "buyer_name",
        "buyer.fullName",
        "Pour compléter ce dossier résidentiel, indiquez l’identité de l’acheteur.",
        "To complete this residential file, add the buyer’s identity.",
        "high",
      ),
    );
  }

  if (!sellerName && ctx.transactionMode !== "fsbo_neutral") {
    out.push(
      mi(
        "seller_name",
        "seller.fullName",
        "Le nom du vendeur est requis pour une promesse ou un mandat résidentiel.",
        "The seller’s name is required for a residential promise or mandate.",
        "high",
      ),
    );
  }

  if (!addr) {
    out.push(
      mi(
        "property_address",
        "listing.address",
        "Ajoutez l’adresse complète de l’immeuble (adresse, ville, code postal).",
        "Add the full property address (street, city, postal code).",
        "high",
      ),
    );
  }

  if (ctx.documentType === "promise_to_purchase" || ctx.documentType === "counter_offer") {
    if (!ctx.dates?.occupancyDate?.trim()) {
      out.push(
        mi(
          "occupancy",
          "dates.occupancyDate",
          "Pour cette promesse d’achat, précisez la date de prise de possession visée.",
          "For this promise to purchase, add the intended occupancy date.",
          "medium",
        ),
      );
    }

    const fin = ctx.conditions?.financing;
    if (!fin?.present && ctx.offerStatus === "draft") {
      out.push(
        mi(
          "financing_condition",
          "conditions.financing",
          "Une condition de financement est souvent requise — indiquez si elle s’applique et l’échéance.",
          "A financing condition often applies — state if it applies and the deadline.",
          "medium",
        ),
      );
    } else if (fin?.present && !fin.deadline?.trim()) {
      out.push(
        mi(
          "financing_deadline",
          "conditions.financing.deadline",
          "Pour compléter cette promesse d’achat, ajoutez l’échéance de la condition de financement.",
          "To complete this promise to purchase, add the financing deadline.",
          "high",
        ),
      );
    }

    const insp = ctx.conditions?.inspection;
    if (!insp?.present && ctx.offerStatus === "draft") {
      out.push(
        mi(
          "inspection_condition",
          "conditions.inspection",
          "Une condition d’inspection préachat semble manquante pour ce type de transaction — confirmez avec le courtier.",
          "An inspection condition may be missing for this deal type — confirm with the broker.",
          "medium",
        ),
      );
    }

    if (!ctx.inclusionsExclusions?.text?.trim() && ctx.offerStatus === "draft") {
      out.push(
        mi(
          "inclusions",
          "inclusionsExclusions",
          "Précisez les inclusions et exclusions (ou indiquez « aucune » si applicable).",
          "Specify inclusions and exclusions (or state none if applicable).",
          "low",
        ),
      );
    }
  }

  if (!ctx.broker?.brokerDisclosureRecorded && ctx.broker?.displayName) {
    out.push(
      mi(
        "broker_disclosure",
        "broker.disclosure",
        "Vérifiez que la divulgation du courtier requise est consignée avant envoi au client.",
        "Ensure required broker disclosure is recorded before sending to the client.",
        "medium",
      ),
    );
  }

  if (ctx.disclosures?.brokerHasInterest && !ctx.disclosures?.conflictOfInterestDeclared) {
    out.push(
      mi(
        "conflict_disclosure",
        "disclosures.conflictOfInterest",
        "Ce dossier semble exiger une divulgation de conflit d’intérêts — documentez avant de poursuivre.",
        "This file appears to require a conflict-of-interest disclosure — document before proceeding.",
        "high",
      ),
    );
  }

  return out;
}
