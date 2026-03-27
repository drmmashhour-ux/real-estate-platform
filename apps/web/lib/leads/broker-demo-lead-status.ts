/**
 * Compact CRM labels for broker demo (maps DB pipeline to New / Contacted / In progress / Converted).
 */
export type BrokerDemoLeadStage = "new" | "contacted" | "in_progress" | "converted" | "lost";

export function brokerDemoLeadStage(pipelineStatus: string | null | undefined): BrokerDemoLeadStage {
  const s = (pipelineStatus ?? "new").toLowerCase();
  if (s === "won" || s === "closed") return "converted";
  if (s === "lost") return "lost";
  if (s === "new") return "new";
  if (s === "contacted" || s === "follow_up") return "contacted";
  return "in_progress";
}

export function brokerDemoLeadStageLabel(stage: BrokerDemoLeadStage): string {
  switch (stage) {
    case "new":
      return "New";
    case "contacted":
      return "Contacted";
    case "in_progress":
      return "In progress";
    case "converted":
      return "Converted";
    case "lost":
      return "Lost";
    default:
      return "In progress";
  }
}
