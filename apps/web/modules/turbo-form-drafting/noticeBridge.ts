import { detectNotices as baseDetectNotices, DraftContext as BaseDraftContext } from "../notice-engine/noticeEngine";
import { TurboDraftInput, TurboDraftNotice, TurboDraftRisk } from "./types";

export function getNoticesForDraft(input: TurboDraftInput, risks: TurboDraftRisk[]): TurboDraftNotice[] {
  // Map TurboDraftInput to BaseDraftContext
  const baseCtx: BaseDraftContext = {
    hasWarrantyExclusion: input.answers.withoutWarranty === true,
    buyerRepresented: input.representedStatus === "REPRESENTED",
    inclusionsModified: input.answers.inclusionsChanged === true || !!input.answers.inclusions,
    containsPersonalData: true, // System default for safety
  };

  const detectedBaseNotices = baseDetectNotices(baseCtx);

  // Map base notices to TurboDraftNotice
  const notices: TurboDraftNotice[] = detectedBaseNotices.map((n) => ({
    noticeKey: n.type,
    title: n.title,
    content: n.content,
    severity: n.severity as any,
  }));

  // Add specific notices based on risks that aren't covered by notice-engine
  risks.forEach((risk) => {
    if (risk.ruleKey === "BUYER_NOT_REPRESENTED") {
      notices.push({
        noticeKey: "LIMITED_ROLE_NOTICE",
        title: "⚖️ Avis: Rôle Limité du Courtier du Vendeur",
        content: "Le courtier du vendeur ne représente pas l'acheteur. Il a l'obligation de traiter l'acheteur de manière équitable mais ne peut pas conseiller l'acheteur au détriment du vendeur. Nous vous recommandons d'être représenté par votre propre courtier.",
        severity: "CRITICAL",
      });
    }
    if (risk.ruleKey === "WARRANTY_EXCLUSION") {
      notices.push({
        noticeKey: "WARRANTY_EXCLUSION_NOTICE",
        title: "⚠️ Avis: Vente Sans Garantie Légale",
        content: "La vente sans garantie légale est à vos risques et périls. En cas de vice caché, vous n'aurez aucun recours contre le vendeur. Il est fortement recommandé de procéder à une inspection préachat approfondie.",
        severity: "CRITICAL",
      });
    }
    if (risk.ruleKey === "MISSING_WITHDRAWAL_ACK") {
      notices.push({
        noticeKey: "RIGHT_OF_WITHDRAWAL_NOTICE",
        title: "🕒 Droit de Dédit (3 jours)",
        content: "Pour toute promesse d'achat, vous disposez d'un délai de dédit de 3 jours après la réception d'une copie signée. Ce droit est d'ordre public selon le Code civil du Québec.",
        severity: "CRITICAL",
      });
    }
    if (risk.ruleKey === "MISSING_PRIVACY_CONSENT") {
      notices.push({
        noticeKey: "PRIVACY_LAW_25_NOTICE",
        title: "🔒 Protection des Renseignements Personnels",
        content: "Conformément à la Loi 25, vos données sont collectées uniquement pour la génération de ce contrat et ne seront partagées qu'avec les parties impliquées après votre consentement explicite.",
        severity: "CRITICAL",
      });
    }
    if (risk.ruleKey === "SHORT_FINANCING_DELAY") {
      notices.push({
        noticeKey: "FINANCING_DELAY_NOTICE",
        title: "ℹ️ Délai de financement court",
        content: "Le délai de financement demandé est inférieur à la norme du marché. Assurez-vous que votre prêteur peut respecter ce délai.",
        severity: "WARNING",
      });
    }
    if (risk.ruleKey === "REFERRAL_COMPENSATION") {
      notices.push({
        noticeKey: "REFERRAL_COMPENSATION_NOTICE",
        title: "💰 Rétribution de référencement",
        content: "Une entente de référencement existe pour cette transaction. Cette information est divulguée à des fins de transparence.",
        severity: "INFO",
      });
    }
    if (risk.ruleKey === "MISSING_EQUITABLE_TREATMENT_ACK") {
      notices.push({
        noticeKey: "EQUITABLE_TREATMENT_NOTICE",
        title: "⚖️ Avis: Traitement Équitable",
        content: "En tant qu'acheteur non représenté, vous avez droit à un traitement équitable de la part du courtier du vendeur. Cela signifie qu'il doit vous fournir une information objective sur les faits pertinents à la transaction, mais il ne peut pas protéger vos intérêts au détriment du vendeur.",
        severity: "CRITICAL",
      });
    }
    if (risk.ruleKey === "MISSING_OACIQ_GUIDE_ACK") {
      notices.push({
        noticeKey: "OACIQ_GUIDE_NOTICE",
        title: "📖 Guide de l'OACIQ",
        content: "L'OACIQ met à votre disposition des guides pour vous aider dans votre transaction immobilière. Nous vous encourageons fortement à les consulter pour mieux comprendre vos droits et obligations.",
        severity: "INFO",
      });
    }
    if (risk.ruleKey === "MOVABLE_AMBIGUITY") {
      notices.push({
        noticeKey: "MOVABLE_AMBIGUITY_NOTICE",
        title: "🏠 Distinction Meubles vs Immeubles",
        content: "Selon le Code civil, certains biens attachés à demeure sont considérés comme immeubles. Pour éviter tout litige, précisez explicitement si les luminaires, rideaux et autres fixtures sont inclus ou exclus.",
        severity: "WARNING",
      });
    }
  });

  return notices;
}
