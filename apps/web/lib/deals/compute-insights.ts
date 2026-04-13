import type { DealRoom, DealRoomDocument, DealRoomTask, Lead } from "@prisma/client";

export type DealRoomInsight = {
  kind: "info" | "warning" | "risk";
  title: string;
  detail: string;
};

const HOURS_24 = 24 * 60 * 60 * 1000;
const DAYS_3 = 3 * 24 * 60 * 60 * 1000;

export function computeDealRoomInsights(input: {
  room: Pick<DealRoom, "stage" | "updatedAt" | "nextFollowUpAt"> & {
    lead: Pick<Lead, "score" | "highIntent" | "lastContactedAt"> | null;
  };
  tasks: Pick<DealRoomTask, "status" | "dueAt" | "title">[];
  documents: Pick<DealRoomDocument, "status" | "title" | "documentType">[];
  hasLegalDraft: boolean;
}): DealRoomInsight[] {
  const insights: DealRoomInsight[] = [];
  const now = Date.now();

  if (input.room.lead?.highIntent || (input.room.lead?.score ?? 0) >= 75) {
    insights.push({
      kind: "info",
      title: "High-intent signal",
      detail: "Lead scoring suggests prioritizing timely follow-up.",
    });
  }

  const overdue = input.tasks.filter(
    (t) => t.status !== "done" && t.dueAt && new Date(t.dueAt).getTime() < now
  );
  if (overdue.length) {
    insights.push({
      kind: "warning",
      title: "Overdue tasks",
      detail: `${overdue.length} open task(s) past due — review dates.`,
    });
  }

  const pendingDocs = input.documents.filter((d) => d.status === "requested" || d.status === "in_progress");
  if (pendingDocs.length) {
    insights.push({
      kind: "warning",
      title: "Documents in flight",
      detail: `${pendingDocs.length} document(s) not completed yet.`,
    });
  }

  if (
    ["offer_preparing", "offer_submitted", "negotiating"].includes(input.room.stage) &&
    !input.hasLegalDraft
  ) {
    insights.push({
      kind: "risk",
      title: "Offer stage without linked form draft",
      detail: "Consider creating or linking a legal form draft when preparing an offer.",
    });
  }

  if (input.room.stage === "visit_completed" && !input.room.nextFollowUpAt) {
    insights.push({
      kind: "warning",
      title: "Visit completed — no follow-up scheduled",
      detail: "Set a next follow-up to keep momentum.",
    });
  }

  const lastTouch = input.room.lead?.lastContactedAt;
  if (lastTouch && now - new Date(lastTouch).getTime() > HOURS_24 && input.room.stage !== "closed") {
    insights.push({
      kind: "info",
      title: "No contact logged in 24h+",
      detail: "Confirm whether the buyer/seller needs outreach.",
    });
  }

  if (now - new Date(input.room.updatedAt).getTime() > DAYS_3 && !["closed", "lost"].includes(input.room.stage)) {
    insights.push({
      kind: "warning",
      title: "Deal appears quiet",
      detail: "No updates on the room in several days — review next steps.",
    });
  }

  return insights.slice(0, 8);
}
