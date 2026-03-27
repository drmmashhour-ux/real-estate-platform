import { describe, expect, it, vi } from "vitest";
import { executeLegalAssistantAction } from "@/src/modules/ai-legal-assistant/application/executeLegalAssistantAction";

vi.mock("@/src/modules/ai-legal-assistant/tools/generateFollowupQuestions", () => ({ generateFollowupQuestions: vi.fn().mockResolvedValue({ questions: ["When?"] }) }));
vi.mock("@/src/modules/ai-legal-assistant/tools/draftInternalComment", () => ({ draftInternalComment: vi.fn().mockResolvedValue({ text: "Review missing fields" }) }));
vi.mock("@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository", () => ({ createAuditLog: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/analytics/posthog-server", () => ({ captureServerEvent: vi.fn() }));

describe("executeLegalAssistantAction", () => {
  it("generates follow-up safely", async () => {
    const out = await executeLegalAssistantAction({ action: "generate_followup_questions", documentId: "d1", sectionKey: "known_defects", userId: "u1" });
    expect(out.type).toBe("generate_followup_questions");
  });

  it("drafts internal comment", async () => {
    const out = await executeLegalAssistantAction({ action: "draft_internal_comment", documentId: "d1", userId: "u1" });
    expect(out.type).toBe("draft_internal_comment");
  });
});
