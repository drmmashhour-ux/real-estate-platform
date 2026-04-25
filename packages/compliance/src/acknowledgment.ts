export type AcknowledgmentTemplateShape = {
  subject: string;
  body: string;
};

export function buildAcknowledgment(
  template: AcknowledgmentTemplateShape,
  vars: { name?: string | null; caseNumber?: string | null }
): { subject: string; body: string } {
  const name = vars.name?.trim() || "Client";
  const caseNumber = vars.caseNumber?.trim() || "";

  const replace = (s: string) =>
    s.replace(/\{\{name\}\}/g, name).replace(/\{\{caseNumber\}\}/g, caseNumber);

  return {
    subject: replace(template.subject),
    body: replace(template.body),
  };
}
