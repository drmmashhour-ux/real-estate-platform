import { openai, isOpenAiConfigured } from "@/lib/ai/openai";

export type AdminFormId = "controls" | "policies" | "property-identities";

export type RefillSuggestions = {
  newFlagKey?: string;
  newFlagReason?: string;
  policyRuleKey?: string;
  policyRuleName?: string;
  policyRuleType?: string;
  policyEffect?: string;
  searchHint?: string;
  note?: string;
  message?: string;
};

const TEMPLATES: Record<
  AdminFormId,
  RefillSuggestions[]
> = {
  controls: [
    { newFlagKey: "dynamic_pricing", newFlagReason: "Enable AI-driven dynamic pricing for hosts" },
    { newFlagKey: "instant_booking", newFlagReason: "Allow instant booking for verified listings" },
    { newFlagKey: "strict_verification", newFlagReason: "Require full verification before publish" },
    { newFlagKey: "maintenance_mode", newFlagReason: "Temporary platform maintenance" },
  ],
  policies: [
    { policyRuleKey: "allow_verified_listing", policyRuleName: "Allow verified listing publish", policyRuleType: "visibility", policyEffect: "ALLOW" },
    { policyRuleKey: "hold_high_risk_payout", policyRuleName: "Hold payout for high-risk accounts", policyRuleType: "payout_release", policyEffect: "DENY" },
    { policyRuleKey: "require_bcp_buyer", policyRuleName: "Require BCP for buyer representation", policyRuleType: "eligibility", policyEffect: "ALLOW" },
  ],
  "property-identities": [
    { searchHint: "Cadastre number or municipal address", note: "Search by cadastre for exact match" },
    { searchHint: "Street name and municipality", note: "Use official address format" },
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function getAdminFormRefillSuggestions(
  formId: AdminFormId,
  currentState?: Record<string, unknown>
): Promise<RefillSuggestions> {
  if (isOpenAiConfigured()) {
    try {
      const prompt = getPromptForForm(formId, currentState);
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You help admins fill out real estate platform admin forms. Reply with a short JSON object only, no markdown. Use keys: newFlagKey, newFlagReason for controls; policyRuleKey, policyRuleName, policyRuleType, policyEffect for policies; searchHint, note for property-identities.",
          },
          { role: "user", content: prompt },
        ],
      });
      const content = completion.choices[0]?.message?.content?.trim() ?? "";
      const json = content.replace(/^```json?\s*|\s*```$/g, "");
      const parsed = JSON.parse(json) as RefillSuggestions;
      return { ...pickRandom(TEMPLATES[formId]), ...parsed, message: "AI suggestion" };
    } catch {
      // fall through to templates
    }
  }

  const suggestion = pickRandom(TEMPLATES[formId]);
  return { ...suggestion, message: "Suggested value" };
}

function getPromptForForm(formId: AdminFormId, currentState?: Record<string, unknown>): string {
  const stateStr = currentState && Object.keys(currentState).length > 0 ? JSON.stringify(currentState) : "none";
  switch (formId) {
    case "controls":
      return `Suggest one feature flag key and reason for the operational controls form. Current state: ${stateStr}. Reply JSON: { "newFlagKey": "...", "newFlagReason": "..." }`;
    case "policies":
      return `Suggest one policy rule for the policy engine. Current state: ${stateStr}. Reply JSON: { "policyRuleKey": "...", "policyRuleName": "...", "policyRuleType": "visibility|eligibility|payout_release|...", "policyEffect": "ALLOW|DENY" }`;
    case "property-identities":
      return `Suggest a search hint or note for the property identity console. Current state: ${stateStr}. Reply JSON: { "searchHint": "...", "note": "..." }`;
    default:
      return `Suggest values for admin form "${formId}". Reply with a JSON object.`;
  }
}
