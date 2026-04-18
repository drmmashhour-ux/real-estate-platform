import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mergeAiFollowUpIntoExplanation, parseAiFollowUpFromExplanation } from "../ai-autopilot-followup-persist";
import { resetFollowUpMonitoringForTests } from "../ai-autopilot-followup-monitoring.service";
import type { LeadFollowUpInput } from "../ai-autopilot-followup.service";
import {
  buildFollowUpQueue,
  buildLeadFollowUpDecision,
  computeFollowUpQueueScore,
} from "../ai-autopilot-followup.service";

const followupFlags = vi.hoisted(() => ({
  followupV1: true,
  followupQueueV1: true,
  followupRemindersV1: true,
}));

const updateMock = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({})),
);

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...mod,
    aiAutopilotFollowupFlags: followupFlags,
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    lead: {
      update: updateMock,
    },
  },
}));

import { executeFollowUpWorkflow } from "../ai-autopilot-followup-execution.service";

function baseLead(over: Partial<LeadFollowUpInput> = {}): LeadFollowUpInput {
  return {
    leadId: "l1",
    name: "Test User",
    email: "t@example.com",
    phone: "+1",
    message: "I would like more information about this property listing please.",
    createdAt: new Date("2026-04-01T12:00:00.000Z"),
    aiScore: 80,
    aiPriority: "high",
    aiTags: ["high_intent"],
    lastContactedAt: null,
    launchSalesContacted: false,
    launchLastContactDate: null,
    pipelineStatus: "new",
    aiExplanation: null,
    ...over,
  };
}

describe("buildLeadFollowUpDecision", () => {
  const now = new Date("2026-04-02T12:00:00.000Z").getTime();

  it("routes high-priority recent untouched lead to due_now", () => {
    const d = buildLeadFollowUpDecision(baseLead({ aiPriority: "high" }), { now, remindersEnabled: true });
    expect(d.status).toBe("due_now");
    expect(d.followUpPriority).toBe("high");
  });

  it("routes low-info lead to queued", () => {
    const d = buildLeadFollowUpDecision(
      baseLead({
        aiPriority: "low",
        aiTags: ["low_info"],
        message: "hi",
      }),
      { now, remindersEnabled: true },
    );
    expect(d.status).toBe("queued");
    expect(d.followUpPriority).toBe("medium");
  });

  it("routes recently handled lead to waiting", () => {
    const d = buildLeadFollowUpDecision(
      baseLead({
        lastContactedAt: new Date("2026-04-02T10:00:00.000Z"),
      }),
      { now, remindersEnabled: true },
    );
    expect(d.status).toBe("waiting");
  });

  it("preserves done from prior explanation", () => {
    const prior = mergeAiFollowUpIntoExplanation(null, {
      version: "v1",
      status: "done",
      updatedAt: "2026-03-01T00:00:00.000Z",
    });
    const d = buildLeadFollowUpDecision(
      baseLead({
        aiExplanation: prior,
      }),
      { now, remindersEnabled: true },
    );
    expect(d.status).toBe("done");
  });

  it("handles malformed explanation safely", () => {
    const d = buildLeadFollowUpDecision(baseLead({ aiExplanation: "not-json" as unknown as object }), {
      now,
      remindersEnabled: true,
    });
    expect(d.status).toMatch(/due_now|queued|new|waiting/);
  });

  it("respects reminders flag off (no nextActionAt)", () => {
    const d = buildLeadFollowUpDecision(baseLead({ aiPriority: "high" }), { now, remindersEnabled: false });
    expect(d.nextActionAt).toBeUndefined();
    expect(d.reminderReason).toBeUndefined();
  });
});

describe("buildFollowUpQueue", () => {
  it("sorts by queueScore descending", () => {
    const a = baseLead({ leadId: "a", aiScore: 40 });
    const b = baseLead({ leadId: "b", aiScore: 90 });
    const q = buildFollowUpQueue([a, b], { remindersEnabled: true });
    expect(q[0]!.leadId).toBe("b");
    expect(q[1]!.leadId).toBe("a");
  });
});

describe("computeFollowUpQueueScore", () => {
  it("is bounded 0–100", () => {
    const s = computeFollowUpQueueScore(baseLead({ aiScore: 999 }), Date.now());
    expect(s).toBeLessThanOrEqual(100);
    expect(s).toBeGreaterThanOrEqual(0);
  });
});

describe("persist helpers", () => {
  it("merges follow-up without dropping sibling keys", () => {
    const merged = mergeAiFollowUpIntoExplanation({ aiMessagingAssist: { version: "v1" } }, {
      version: "v1",
      status: "queued",
      updatedAt: "2026-04-01T00:00:00.000Z",
    });
    const o = merged as Record<string, unknown>;
    expect(o.aiMessagingAssist).toBeDefined();
    expect(o.aiFollowUp).toBeDefined();
  });

  it("parses valid follow-up blob", () => {
    const ex = mergeAiFollowUpIntoExplanation(null, {
      version: "v1",
      status: "waiting",
      updatedAt: "2026-04-01T00:00:00.000Z",
    });
    const p = parseAiFollowUpFromExplanation(ex);
    expect(p?.status).toBe("waiting");
  });
});

describe("executeFollowUpWorkflow", () => {
  beforeEach(() => {
    updateMock.mockClear();
    updateMock.mockImplementation(() => Promise.resolve({}));
    followupFlags.followupV1 = true;
    resetFollowUpMonitoringForTests();
  });

  it("writes internal metadata via prisma when flag on", async () => {
    await executeFollowUpWorkflow([
      {
        id: "l1",
        name: "A",
        email: "a@b.com",
        phone: "1",
        message: "hello there this is long enough",
        createdAt: new Date(),
        aiScore: 88,
        aiPriority: "high",
        aiTags: [],
        lastContactedAt: null,
        launchSalesContacted: false,
        launchLastContactDate: null,
        pipelineStatus: "new",
        aiExplanation: null,
      },
    ]);
    expect(updateMock).toHaveBeenCalled();
    const arg = updateMock.mock.calls[0]![0] as { data: { aiExplanation: unknown } };
    expect(arg.data.aiExplanation).toBeDefined();
  });

  it("skips when follow-up flag off", async () => {
    followupFlags.followupV1 = false;
    await executeFollowUpWorkflow([
      {
        id: "l1",
        name: "A",
        email: "a@b.com",
        phone: "1",
        message: "x",
        createdAt: new Date(),
        aiScore: 50,
        aiPriority: "low",
        aiTags: [],
        lastContactedAt: null,
        launchSalesContacted: false,
        launchLastContactDate: null,
        pipelineStatus: "new",
        aiExplanation: null,
      },
    ]);
    expect(updateMock).not.toHaveBeenCalled();
  });
});

describe("safety", () => {
  it("follow-up execution module does not import messaging transports", () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(dir, "../ai-autopilot-followup-execution.service.ts"), "utf8");
    expect(/nodemailer|twilio|resend|whatsapp|sendgrid/i.test(src)).toBe(false);
  });
});
