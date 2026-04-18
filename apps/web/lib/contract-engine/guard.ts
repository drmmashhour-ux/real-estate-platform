import { aiContractEngineFlags } from "@/config/feature-flags";

export function requireAiContractEngine(): Response | null {
  if (!aiContractEngineFlags.aiContractEngineV1) {
    return Response.json({ error: "AI Contract Engine disabled" }, { status: 403 });
  }
  return null;
}
