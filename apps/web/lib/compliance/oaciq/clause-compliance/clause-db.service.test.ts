import { describe, expect, it } from "vitest";
import { validateClauseAgainstLibrary } from "@/lib/compliance/oaciq/clause-compliance/clause-db.service";
import type { ClausesLibrary } from "@prisma/client";

const libBase: Pick<
  ClausesLibrary,
  "requiresActor" | "requiresDeadline" | "requiresNotice" | "requiresConsequence" | "templateText"
> = {
  requiresActor: true,
  requiresDeadline: true,
  requiresNotice: true,
  requiresConsequence: true,
  templateText: "Template {{deadline}}",
};

describe("validateClauseAgainstLibrary", () => {
  it("requires all structural flags", () => {
    const v = validateClauseAgainstLibrary(
      {
        customText: null,
        actorDefined: false,
        deadlineDefined: true,
        noticeDefined: true,
        consequenceDefined: true,
      },
      libBase,
    );
    expect(v.valid).toBe(false);
    expect(v.errorCodes).toContain("MISSING_ACTOR");
  });

  it("passes when flags set and no ambiguity", () => {
    const v = validateClauseAgainstLibrary(
      {
        customText: "Le délai est le 30 avril 2026.",
        actorDefined: true,
        deadlineDefined: true,
        noticeDefined: true,
        consequenceDefined: true,
      },
      libBase,
    );
    expect(v.valid).toBe(true);
  });
});
