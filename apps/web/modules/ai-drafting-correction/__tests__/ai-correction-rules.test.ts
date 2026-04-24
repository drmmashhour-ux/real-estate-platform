import { describe, expect, it } from "vitest";
import { runDeterministicCorrectionRules } from "@/modules/ai-drafting-correction/aiCorrectionRules";
import { computeTurboDraftStatusFromFindings } from "@/modules/ai-drafting-correction/turbo-draft-gate";
import type { AiDraftInput } from "@/modules/ai-drafting-correction/types";
import { extractProtectedSpans } from "@/modules/ai-drafting-correction/notice-protect";
import { CONTRACT_BRAIN_LIMITED_ROLE_HTML_MARKER } from "@/lib/legal/contract-brain-html";

function baseInput(over: Partial<AiDraftInput>): AiDraftInput {
  return {
    draftId: "d1",
    userId: "u1",
    formKey: "lecipm_promise_to_purchase",
    role: "broker",
    locale: "fr",
    draftSections: [],
    ...over,
  };
}

describe("AiDraftingCorrectionEngine rules", () => {
  it("detects unclear warranty exclusion as critical blocking", () => {
    const input = baseInput({
      draftSections: [
        {
          sectionKey: "LEGAL_WARRANTY",
          bodyText: "La garantie légale est exclue sans autre précision.",
        },
      ],
    });
    const f = runDeterministicCorrectionRules(input);
    const w = f.find((x) => x.findingKey === "WARRANTY_EXCLUSION_UNCLEAR");
    expect(w).toBeDefined();
    expect(w?.severity).toBe("CRITICAL");
    expect(w?.blocking).toBe(true);
  });

  it("detects missing buyer representation notice when buyer unrepresented", () => {
    const input = baseInput({
      draftSections: [{ sectionKey: "MAIN", bodyText: "Promesse d'achat pour le lot." }],
      transactionContext: { buyerRepresented: false },
    });
    const f = runDeterministicCorrectionRules(input);
    expect(f.some((x) => x.findingKey === "MISSING_BUYER_REPRESENTATION_NOTICE")).toBe(true);
  });

  it("detects EV charger ambiguity", () => {
    const input = baseInput({
      draftSections: [
        {
          sectionKey: "CHATTELS",
          bodyText: "Une borne de recharge est installée sur le stationnement.",
        },
      ],
    });
    const f = runDeterministicCorrectionRules(input);
    expect(f.some((x) => x.findingKey === "EV_CHARGER_AMBIGUITY")).toBe(true);
  });

  it("computes BLOCKED turbo status for critical blocking findings", () => {
    const st = computeTurboDraftStatusFromFindings([
      {
        findingKey: "X",
        severity: "CRITICAL",
        messageFr: "m",
        messageEn: "m",
        blocking: true,
      },
    ]);
    expect(st).toBe("BLOCKED");
  });

  it("protected spans extract contract brain marker blocks", () => {
    const html = `${CONTRACT_BRAIN_LIMITED_ROLE_HTML_MARKER}<section>x</section>suite`;
    const spans = extractProtectedSpans(html);
    expect(spans.length).toBe(1);
    expect(spans[0].content).toContain("section");
  });
});
