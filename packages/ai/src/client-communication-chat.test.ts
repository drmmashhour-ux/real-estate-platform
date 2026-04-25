import { describe, expect, it } from "vitest";
import {
  CLIENT_CHAT_DISCLAIMER,
  QUEBEC_BROKERAGE_NOTICE,
  classifyQuebecTier,
  processClientChatTurn,
  computeChatLeadScore,
  type QualificationState,
} from "./client-communication-chat";

const ctx = {
  listingId: null,
  projectId: null,
  listingTitle: "123 Main",
  city: "Mirabel",
  availabilityNote: null,
  features: ["Garage"],
  introducedByBrokerId: null,
};

describe("Quebec compliance copy", () => {
  it("disclaimer mentions regulated brokerage / not a broker", () => {
    expect(QUEBEC_BROKERAGE_NOTICE.toLowerCase()).toMatch(/québec|regulated|not.*broker|oaciq|courtier/i);
    expect(CLIENT_CHAT_DISCLAIMER.length).toBeGreaterThan(40);
  });
});

describe("classifyQuebecTier", () => {
  it("HOT when soon + pre-approved", () => {
    expect(
      classifyQuebecTier({
        transcript: [],
        timeline: "soon",
        financing: "pre_approved",
        budgetRange: "$500k",
      })
    ).toBe("hot");
  });

  it("HOT when soon + cash", () => {
    expect(
      classifyQuebecTier({
        transcript: [],
        timeline: "soon",
        financing: "cash",
        budgetRange: "$500k",
      })
    ).toBe("hot");
  });

  it("COLD when later", () => {
    expect(
      classifyQuebecTier({
        transcript: [],
        timeline: "later",
        financing: "exploring",
        budgetRange: "$400k",
      })
    ).toBe("cold");
  });

  it("WARM when soon + exploring", () => {
    expect(
      classifyQuebecTier({
        transcript: [],
        timeline: "soon",
        financing: "exploring",
        budgetRange: "$500k",
      })
    ).toBe("warm");
  });

  it("HOT when soon + visit intent (even if financing exploring)", () => {
    expect(
      classifyQuebecTier({
        transcript: [],
        timeline: "soon",
        financing: "exploring",
        budgetRange: "$500k",
        visitIntent: true,
      })
    ).toBe("hot");
  });

  it("HOT when broker speak intent + soon", () => {
    expect(
      classifyQuebecTier({
        transcript: [],
        timeline: "soon",
        financing: "exploring",
        budgetRange: "$500k",
        brokerSpeakIntent: true,
      })
    ).toBe("hot");
  });
});

describe("processClientChatTurn", () => {
  it("starts with property opener + buy-soon question", () => {
    const r = processClientChatTurn({
      message: "",
      state: { transcript: [] },
      context: ctx,
    });
    expect(r.reply).toMatch(/Hi! I can help you with this property/i);
    expect(r.reply).toMatch(/this property/i);
    expect(r.reply).toMatch(/buy soon|just exploring/i);
    expect(r.reply).toContain(CLIENT_CHAT_DISCLAIMER.slice(0, 30));
  });

  it("escalates legal questions", () => {
    const r = processClientChatTurn({
      message: "Can you give me legal advice on the deed?",
      state: { transcript: [] },
      context: ctx,
    });
    expect(r.flags.escalateToBroker).toBe(true);
    expect(r.flags.escalationReason).toBe("legal_or_financial");
  });

  it("availability uses soft language + timeline question", () => {
    const r = processClientChatTurn({
      message: "Is this still available?",
      state: { transcript: [] },
      context: ctx,
    });
    expect(r.reply).toMatch(/👍|broker/i);
    expect(r.reply).toMatch(/Mirabel/i);
    expect(r.reply).toMatch(/buy soon|just exploring/i);
  });

  it("cold path skips contact", () => {
    const r = processClientChatTurn({
      message: "Just browsing thanks",
      state: {
        transcript: [],
        timeline: "later",
        budgetRange: "$300k",
        financing: "exploring",
      },
      context: ctx,
    });
    expect(r.flags.chatCompleteCold).toBe(true);
    expect(r.flags.leadReady).toBe(false);
    expect(r.flags.qualificationTier).toBe("cold");
  });

  it("hot path asks handoff line after full contact", () => {
    const state: QualificationState = {
      transcript: ["User: soon", "User: 500k", "User: pre-approved yes"],
      timeline: "soon",
      financing: "pre_approved",
      budgetRange: "$500k",
      preferredContactTime: "anytime",
      name: "Jane Buyer",
      email: "jane@example.com",
      phone: "5145550100",
    };
    const r = processClientChatTurn({
      message: "That's everything",
      state,
      context: ctx,
    });
    expect(r.flags.leadReady).toBe(true);
    expect(r.flags.qualificationTier).toBe("hot");
    expect(r.reply).toMatch(/broker will contact you shortly/i);
    expect(r.reply).toMatch(/👍/);
    const score = computeChatLeadScore(r.state);
    expect(score.tier).toBe("hot");
  });
});
