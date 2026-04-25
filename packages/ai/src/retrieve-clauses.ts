import { retrieveDraftingContextForForm } from "@/lib/ai/retrieve-drafting-context";

export async function retrieveClauseCandidates(input: {
  formType: string;
  clauseTopic: string;
  transactionFacts: Record<string, unknown>;
}) {
  const query = `
Form type: ${input.formType}
Clause topic: ${input.clauseTopic}
Facts: ${JSON.stringify(input.transactionFacts)}
Need the most relevant OACIQ or book passages for drafting this clause.
`;

  return retrieveDraftingContextForForm({
    formType: input.formType,
    query,
  });
}
