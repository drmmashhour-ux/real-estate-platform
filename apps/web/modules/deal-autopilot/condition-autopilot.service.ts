/** Summaries for broker review — data from DealClosingCondition rows only. */
export function summarizePendingConditions(rows: { conditionType: string; status: string; deadline: Date | null }[]) {
  return rows
    .filter((r) => r.status === "pending")
    .map((r) => ({
      type: r.conditionType,
      deadline: r.deadline?.toISOString() ?? null,
    }));
}
