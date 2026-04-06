import { describe, expect, it } from "vitest";
import {
  evaluateNextStep,
  inferPlaybookKeyFromLead,
  PLAYBOOK_KEYS,
  previewStepFromLeadSnapshot,
} from "../playbookEngine";

const baseLead = {
  shortTermListingId: null as string | null,
  fsboListingId: null as string | null,
  listingId: null as string | null,
  highIntent: false,
  pipelineStatus: "new",
};

describe("playbookEngine", () => {
  it("simulates buyer flow: browsing → inquiry → high intent", () => {
    expect(
      previewStepFromLeadSnapshot({
        ...baseLead,
        leadSource: "listing_contact",
        executionStage: "browsing",
        intentScore: 20,
        pipelineStatus: "new",
      }).stepOrder
    ).toBe(1);

    expect(
      previewStepFromLeadSnapshot({
        ...baseLead,
        leadSource: "listing_contact",
        executionStage: "inquiry_sent",
        intentScore: 40,
        pipelineStatus: "contacted",
      }).stepOrder
    ).toBe(2);

    expect(
      previewStepFromLeadSnapshot({
        ...baseLead,
        leadSource: "listing_contact",
        executionStage: "booking_started",
        intentScore: 55,
        pipelineStatus: "negotiation",
      }).stepOrder
    ).toBe(3);

    expect(
      previewStepFromLeadSnapshot({
        ...baseLead,
        leadSource: "listing_contact",
        executionStage: "browsing",
        intentScore: 75,
        pipelineStatus: "new",
      }).stepOrder
    ).toBe(3);
  });

  it("simulates host flow: interested → listed → active", () => {
    expect(
      previewStepFromLeadSnapshot({
        ...baseLead,
        leadSource: "bnhub_host",
        executionStage: "browsing",
        intentScore: 10,
        pipelineStatus: "new",
      }).stepOrder
    ).toBe(1);

    expect(
      previewStepFromLeadSnapshot({
        ...baseLead,
        leadSource: "host_onboarding",
        executionStage: "viewing_property",
        intentScore: 30,
        pipelineStatus: "new",
        shortTermListingId: "lst_1",
      }).stepOrder
    ).toBe(2);

    expect(
      previewStepFromLeadSnapshot({
        ...baseLead,
        leadSource: "bnhub_host",
        executionStage: "booking_started",
        intentScore: 40,
        pipelineStatus: "contacted",
        shortTermListingId: "lst_1",
      }).stepOrder
    ).toBe(3);
  });

  it("simulates broker flow: invited → active", () => {
    expect(
      previewStepFromLeadSnapshot({
        ...baseLead,
        leadSource: "broker_partner_recruit",
        executionStage: "browsing",
        intentScore: 10,
        pipelineStatus: "new",
      }).stepOrder
    ).toBe(1);

    expect(
      previewStepFromLeadSnapshot({
        ...baseLead,
        leadSource: "broker_partner_invite",
        executionStage: "browsing",
        intentScore: 20,
        pipelineStatus: "contacted",
      }).stepOrder
    ).toBe(2);
  });

  it("inferPlaybookKeyFromLead maps sources", () => {
    expect(inferPlaybookKeyFromLead({ leadSource: "x", shortTermListingId: null })).toBe(PLAYBOOK_KEYS.buyer);
    expect(inferPlaybookKeyFromLead({ leadSource: "bnhub_host_waitlist", shortTermListingId: null })).toBe(
      PLAYBOOK_KEYS.host
    );
    expect(inferPlaybookKeyFromLead({ leadSource: "broker_recruit_qc", shortTermListingId: null })).toBe(
      PLAYBOOK_KEYS.broker
    );
    expect(inferPlaybookKeyFromLead({ leadSource: "broker_consultation", shortTermListingId: null })).toBe(
      PLAYBOOK_KEYS.buyer
    );
  });

  it("evaluateNextStep uses explicit playbook key", () => {
    expect(
      evaluateNextStep({
        playbookKey: PLAYBOOK_KEYS.buyer,
        executionStage: "negotiation",
        intentScore: 50,
        highIntent: false,
        pipelineStatus: "negotiation",
        hasListingContext: false,
        bookingOrNegotiation: true,
      })
    ).toBe(3);
  });
});
