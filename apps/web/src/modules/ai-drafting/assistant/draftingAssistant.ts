import { getDraftTemplateById } from "@/src/modules/ai-drafting/templates/templateEngine";
import { retrieveRelevantKnowledge } from "@/src/modules/ai-drafting/knowledge/knowledgeService";
import { getLegalContext } from "@/src/modules/knowledge/retrieval/legalContextRetrievalService";

type SuggestArgs = {
  templateId: string;
  fieldKey: string;
  context: Record<string, string>;
};

export async function suggestFieldText(args: SuggestArgs) {
  const template = getDraftTemplateById(args.templateId);
  if (!template) return { suggestion: "", reasons: ["Unknown template"] };
  const field = template.fields.find((f) => f.key === args.fieldKey);
  if (!field) return { suggestion: "", reasons: ["Unknown field"] };

  const contextText = Object.entries(args.context)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
  const query = `${field.label} ${contextText}`;

  const dbRefs = await getLegalContext(query, { documentType: "drafting", limit: 5 }).catch(() => []);
  const staticRefs = retrieveRelevantKnowledge(query, 3);
  const reasons =
    dbRefs.length > 0
      ? dbRefs.map((r) => `${r.source.title} (p.${r.pageNumber ?? "—"}, ${r.importance}): ${r.content.slice(0, 220)}`)
      : staticRefs.map((r) => `${r.title}: ${r.chunkText}`);

  let suggestion = "";
  if (field.key.includes("date")) suggestion = new Date().toISOString().slice(0, 10);
  else if (field.key.includes("clause")) suggestion = "Refer to the signed agreement clause and section number.";
  else if (field.key.includes("scope")) suggestion = "Define services, deliverables, and exclusions in plain terms.";
  else suggestion = `${field.label} as per supporting records.`;

  return {
    suggestion,
    reasons,
  };
}

export async function explainClause(clauseText: string) {
  const refs = await getLegalContext(clauseText, { documentType: "drafting", limit: 3 }).catch(() => []);
  const staticRefs = retrieveRelevantKnowledge(clauseText, 2);
  const references =
    refs.length > 0
      ? refs.map((r) => ({
          title: r.source.title,
          excerpt: r.content.slice(0, 280),
          pageNumber: r.pageNumber,
          importance: r.importance,
        }))
      : staticRefs.map((r) => ({ title: r.title, excerpt: r.chunkText, pageNumber: null as number | null, importance: "optional" }));

  return {
    explanation:
      "Review clause text against the cited drafting guides. This assistant surfaces retrieved passages only — not legal conclusions.",
    references,
  };
}

export function improveWording(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return {
    improved: cleaned.length ? `${cleaned} (reviewed for clarity and neutral legal tone).` : "",
    note: "Wording assistance is stylistic only and does not create legal advice.",
  };
}
