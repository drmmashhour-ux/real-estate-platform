export type DraftTemplateField = {
  key: string;
  label: string;
  required: boolean;
  placeholder?: string;
};

export type DraftTemplate = {
  id: string;
  name: string;
  jurisdiction: string;
  body: string;
  fields: DraftTemplateField[];
};

const templates: DraftTemplate[] = [
  {
    id: "lease_notice_v1",
    name: "Lease Notice",
    jurisdiction: "QC",
    fields: [
      { key: "landlord_name", label: "Landlord name", required: true },
      { key: "tenant_name", label: "Tenant name", required: true },
      { key: "property_address", label: "Property address", required: true },
      { key: "notice_date", label: "Notice date", required: true, placeholder: "YYYY-MM-DD" },
      { key: "effective_date", label: "Effective date", required: true, placeholder: "YYYY-MM-DD" },
      { key: "clause_reference", label: "Clause reference", required: true },
    ],
    body:
      "NOTICE OF LEASE MATTER\n\nIssued by: {{landlord_name}}\nTo: {{tenant_name}}\nProperty: {{property_address}}\nDate of notice: {{notice_date}}\nEffective date: {{effective_date}}\nContract clause reference: {{clause_reference}}\n\nThis notice is generated from a structured template. Review with counsel before execution.",
  },
  {
    id: "broker_engagement_v1",
    name: "Broker Engagement Letter",
    jurisdiction: "QC",
    fields: [
      { key: "client_name", label: "Client name", required: true },
      { key: "broker_name", label: "Broker name", required: true },
      { key: "service_scope", label: "Service scope", required: true },
      { key: "fee_terms", label: "Fee terms", required: true },
      { key: "start_date", label: "Start date", required: true, placeholder: "YYYY-MM-DD" },
      { key: "end_date", label: "End date", required: true, placeholder: "YYYY-MM-DD" },
    ],
    body:
      "BROKER ENGAGEMENT LETTER\n\nClient: {{client_name}}\nBroker: {{broker_name}}\nScope: {{service_scope}}\nFees: {{fee_terms}}\nStart: {{start_date}}\nEnd: {{end_date}}\n\nThis draft is template-based and must be reviewed for legal compliance.",
  },
];

export function listDraftTemplates() {
  return templates;
}

export function getDraftTemplateById(templateId: string) {
  return templates.find((t) => t.id === templateId) ?? null;
}

export function fillTemplateFields(template: DraftTemplate, values: Record<string, string>) {
  return template.fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = String(values[field.key] ?? "").trim();
    return acc;
  }, {});
}

export function generateDraftDocument(template: DraftTemplate, values: Record<string, string>) {
  const filled = fillTemplateFields(template, values);
  let content = template.body;
  for (const field of template.fields) {
    const token = `{{${field.key}}}`;
    content = content.split(token).join(filled[field.key] || "[MISSING]");
  }
  return { content, values: filled };
}
