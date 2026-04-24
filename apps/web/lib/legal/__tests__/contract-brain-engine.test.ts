import { describe, expect, it } from "vitest";
import {
  computeRequiredNoticeKeysFromContext,
  injectNoticesIntoDraft,
  resolveRequiredNoticeKeysForEvaluation,
} from "@/lib/legal/contract-brain-engine";
import { LIMITED_ROLE_NOTICE_KEY } from "@/lib/legal/contract-brain-notices";
import { CONTRACT_BRAIN_LIMITED_ROLE_HTML_MARKER } from "@/lib/legal/contract-brain-html";

describe("contract brain engine", () => {
  it("requires LIMITED_ROLE_NOTICE for unrepresented buyer", () => {
    expect(
      computeRequiredNoticeKeysFromContext({ role: "BUYER", isBuyerRepresented: false })
    ).toEqual([LIMITED_ROLE_NOTICE_KEY]);
  });

  it("requires LIMITED_ROLE_NOTICE for unrepresented tenant", () => {
    expect(
      computeRequiredNoticeKeysFromContext({ role: "TENANT", isTenantRepresented: false })
    ).toEqual([LIMITED_ROLE_NOTICE_KEY]);
  });

  it("does not require notice for represented buyer", () => {
    expect(
      computeRequiredNoticeKeysFromContext({ role: "BUYER", isBuyerRepresented: true })
    ).toEqual([]);
  });

  it("does not require notice when role missing", () => {
    expect(computeRequiredNoticeKeysFromContext({ isBuyerRepresented: false })).toEqual([]);
  });

  it("injects locked HTML and persists required keys in content", () => {
    const { html, content } = injectNoticesIntoDraft({
      html: "<p>Terms</p>",
      contentJson: {},
      context: { role: "BUYER", isBuyerRepresented: false },
    });
    expect(html).toContain(CONTRACT_BRAIN_LIMITED_ROLE_HTML_MARKER);
    expect(html).toContain("Avis important");
    expect(JSON.stringify(content)).toContain(LIMITED_ROLE_NOTICE_KEY);
    expect(JSON.stringify(content)).toContain("1.0.0");
  });

  it("uses stored requiredNoticeKeys on contract content when present", () => {
    const keys = resolveRequiredNoticeKeysForEvaluation(
      { contractBrain: { requiredNoticeKeys: [LIMITED_ROLE_NOTICE_KEY] } },
      { role: "BUYER", isBuyerRepresented: true }
    );
    expect(keys).toEqual([LIMITED_ROLE_NOTICE_KEY]);
  });

  it("does not duplicate injection when marker already present", () => {
    const first = injectNoticesIntoDraft({
      html: "<p>x</p>",
      contentJson: {},
      context: { role: "BUYER", isBuyerRepresented: false },
    });
    const second = injectNoticesIntoDraft({
      html: first.html,
      contentJson: first.content,
      context: { role: "BUYER", isBuyerRepresented: false },
    });
    const count = second.html.split(CONTRACT_BRAIN_LIMITED_ROLE_HTML_MARKER).length - 1;
    expect(count).toBe(1);
  });
});
