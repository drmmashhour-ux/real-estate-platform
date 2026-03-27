import { getSectionSchema } from "@/src/modules/ai-auto-drafting/infrastructure/autoDraftingTemplateService";

export function computeSectionCompleteness(templateId: string, sectionKey: string, facts: Record<string, unknown>) {
  const section = getSectionSchema(templateId, sectionKey);
  if (!section) return { percent: 0, missing: [] as string[] };
  const missing: string[] = [];
  let total = 0;
  let filled = 0;
  for (const f of section.fields) {
    if (f.conditional) {
      const condVal = facts[f.conditional.fieldKey];
      if (condVal !== f.conditional.equals) continue;
    }
    total += 1;
    const v = facts[f.key];
    const has = typeof v === "boolean" ? true : String(v ?? "").trim().length > 0;
    if (has) filled += 1;
    else if (f.required) missing.push(f.label);
  }
  const percent = total ? Math.round((filled / total) * 100) : 0;
  return { percent, missing };
}
