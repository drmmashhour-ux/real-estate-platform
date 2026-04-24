import { getFormTemplate } from "./formRegistry";
import { runValidationRules } from "./validationRules";
import { getNoticesForDraft } from "./noticeBridge";
import { TurboDraftInput, TurboDraftResult, TurboDraftSection } from "./types";
import { logTurboDraftEvent } from "./auditLogger";
import { alignDraftToFormSchema } from "../form-style-validation/alignmentEngine";

export async function buildTurboDraft(input: TurboDraftInput): Promise<TurboDraftResult> {
  const template = getFormTemplate(input.formKey);
  if (!template) throw new Error(`Form template not found: ${input.formKey}`);

  // 1. Run validation rules
  const risks = runValidationRules(input);

  // 2. Map risks to notices
  const notices = getNoticesForDraft(input, risks);

  // 3. Generate sections
  let sections: TurboDraftSection[] = [];

  // PARTIES Section
  sections.push({
    id: "PARTIES",
    title: "PARTIES",
    content: `Identification des parties:\n\n${input.parties
      .map((p) => `- ${p.role}: ${p.name} (${p.email || "pas de courriel"})`)
      .join("\n")}`,
    isMandatory: true,
  });

  // PROPERTY Section
  sections.push({
    id: "PROPERTY",
    title: "PROPERTY",
    content: `Désignation de l'immeuble:\n\nAdresse: ${input.property.address}, ${input.property.city}\nType: ${input.property.type}`,
    isMandatory: true,
  });

  // Template specific sections
  if (input.formKey === "PROMISE_TO_PURCHASE") {
    sections.push({
      id: "PRICE",
      title: "PRICE",
      content: `Le prix d'achat proposé est de $${(input.answers.purchasePrice / 100).toLocaleString("fr-CA")}.`,
      isMandatory: true,
    });

    if (input.answers.financingRequired) {
      sections.push({
        id: "FINANCING",
        title: "FINANCING",
        content: `L'acheteur s'engage à obtenir un financement dans un délai de ${input.answers.financingDelay || "—"} jours.`,
        isMandatory: true,
      });
    }

    sections.push({
      id: "WARRANTY",
      title: "LEGAL_WARRANTY",
      content: input.answers.withoutWarranty
        ? "La vente est faite sans garantie légale, aux risques et périls de l'acheteur."
        : "La vente est faite avec garantie légale de droit.",
      isMandatory: true,
    });

    sections.push({
      id: "INCLUSIONS",
      title: "INCLUSIONS_EXCLUSIONS",
      content: `Inclusions: ${input.answers.inclusions || "Aucune"}\nExclusions: ${input.answers.exclusions || "Aucune"}`,
      isMandatory: true,
    });
  }

  // 3.5. Run FormStyleValidationEngine Alignment
  const alignment = alignDraftToFormSchema(input.formKey, sections);
  // @ts-ignore
  sections = alignment.sections;

  // 4. Final check for proceed ability
  const blockingRisks = risks.filter((r) => r.blocking);
  const clauseIssues = alignment.validation.clauses.filter(c => c.blocking);
  const sectionIssues = alignment.validation.sections.missingSections.length > 0;

  const canProceed = blockingRisks.length === 0 && clauseIssues.length === 0 && !sectionIssues;

  // 5. Audit log
  await logTurboDraftEvent({
    userId: input.userId,
    draftId: input.draftId,
    eventKey: canProceed ? "turbo_draft_generated" : "turbo_draft_blocked",
    severity: canProceed ? "INFO" : "WARNING",
    payload: { risks, noticeCount: notices.length, alignmentIssues: alignment.validation },
  });

  return {
    draftId: input.draftId,
    formKey: input.formKey,
    title: template.title,
    sections,
    notices,
    risks,
    canProceed,
    blockingReasons: [
      ...blockingRisks.map((r) => r.messageFr),
      ...clauseIssues.map(c => c.issue),
      ...(sectionIssues ? alignment.validation.sections.missingSections.map(s => `Section manquante: ${s}`) : [])
    ],
    // @ts-ignore
    styleValidation: alignment.validation
  };
}
