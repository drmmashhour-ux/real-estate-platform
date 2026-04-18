import { listConditions } from "./condition-tracker.service";

/** Maps tracked conditions to human-readable obligations for timeline / client UX. */
export async function summarizeObligations(dealId: string) {
  const rows = await listConditions(dealId);
  return rows.map((c) => ({
    id: c.id,
    label: c.conditionType,
    status: c.status,
    due: c.deadline?.toISOString() ?? null,
    relatedForm: c.relatedForm,
    notes: c.notes,
  }));
}
