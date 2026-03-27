import type { TransparencyEvent } from "@/src/modules/client-trust-experience/domain/clientExperience.types";

type AuditRow = {
  id?: string;
  createdAt?: Date | string;
  actionType: string;
  metadata?: Record<string, unknown> | null;
};

function kindFromAction(actionType: string): TransparencyEvent["kind"] {
  const a = actionType.toLowerCase();
  if (a.includes("ai") || a.includes("suggestion") || a.includes("declaration_ai")) return "ai";
  if (a.includes("approve") || a.includes("signed") || a.includes("final")) return "approval";
  if (a.includes("status") || a.includes("draft") || a.includes("version") || a.includes("updated")) return "edit";
  return "other";
}

export function buildTransparencyTimeline(audit: AuditRow[]): TransparencyEvent[] {
  return audit.map((row, i) => {
    const at =
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : typeof row.createdAt === "string"
          ? row.createdAt
          : "";
    return {
      id: String(row.id ?? `audit-${i}`),
      at,
      label: row.actionType.replace(/_/g, " "),
      detail: row.metadata && typeof row.metadata === "object" ? JSON.stringify(row.metadata).slice(0, 200) : undefined,
      kind: kindFromAction(row.actionType),
    };
  });
}
