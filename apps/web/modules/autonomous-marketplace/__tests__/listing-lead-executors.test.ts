import { describe, expect, it } from "vitest";
import { ListingActionExecutor } from "../execution/executors/listing-action.executor";
import { LeadActionExecutor } from "../execution/executors/lead-action.executor";
import type { ProposedAction } from "../types/domain.types";

const listingAction = (type: ProposedAction["type"], id = "lst-1"): ProposedAction => ({
  id: "pa1",
  type,
  target: { type: "fsbo_listing", id },
  confidence: 0.9,
  risk: "LOW",
  title: "t",
  explanation: "e",
  humanReadableSummary: "h",
  metadata: {},
  suggestedAt: new Date().toISOString(),
  sourceDetectorId: "d",
  opportunityId: "o",
});

const leadAction = (type: ProposedAction["type"], id: string | null): ProposedAction => ({
  id: "pa2",
  type,
  target: { type: "lead", id },
  confidence: 0.9,
  risk: "LOW",
  title: "t",
  explanation: "e",
  humanReadableSummary: "h",
  metadata: {},
  suggestedAt: new Date().toISOString(),
  sourceDetectorId: "d",
  opportunityId: "o",
});

describe("ListingActionExecutor", () => {
  it("always returns DRY_RUN with Would execute … message", async () => {
    const ex = new ListingActionExecutor();
    const r = await ex.execute(listingAction("UPDATE_LISTING_COPY"), {
      dryRun: false,
      allowExecute: true,
    });
    expect(r.status).toBe("DRY_RUN");
    expect(r.message).toContain("Would execute UPDATE_LISTING_COPY");
    expect(r.detail).toBe(r.message);
    expect(r.metadata.dryRun).toBe(true);
  });
});

describe("LeadActionExecutor", () => {
  it("always returns DRY_RUN with Would execute … message", async () => {
    const ex = new LeadActionExecutor();
    const r = await ex.execute(leadAction("SEND_LEAD_FOLLOWUP", "lead-9"), {
      dryRun: false,
      allowExecute: true,
    });
    expect(r.status).toBe("DRY_RUN");
    expect(r.message).toContain("Would execute SEND_LEAD_FOLLOWUP");
    expect(r.message).toContain("lead-9");
  });

  it("dry-runs when lead id missing", async () => {
    const ex = new LeadActionExecutor();
    const r = await ex.execute(leadAction("CREATE_TASK", null), {
      dryRun: false,
      allowExecute: true,
    });
    expect(r.status).toBe("DRY_RUN");
    expect(r.message).toContain("lead id missing");
  });
});
