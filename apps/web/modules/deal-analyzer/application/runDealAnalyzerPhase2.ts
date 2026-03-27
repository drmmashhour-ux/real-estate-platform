import {
  isDealAnalyzerBnhubModeEnabled,
  isDealAnalyzerCompsEnabled,
  isDealAnalyzerEnabled,
  isDealAnalyzerScenariosEnabled,
} from "@/modules/deal-analyzer/config";
import { runComparableAnalysis } from "@/modules/deal-analyzer/application/runComparableAnalysis";
import { runScenarioSimulation } from "@/modules/deal-analyzer/application/runScenarioSimulation";
import { runBnHubDealAnalysis } from "@/modules/deal-analyzer/application/runBnHubDealAnalysis";
import { generateDealDecision } from "@/modules/deal-analyzer/application/generateDealDecision";

export async function runDealAnalyzerPhase2(args: {
  listingId: string;
  financing?: { loanPrincipalCents: number | null; annualRate?: number; termYears?: number } | null;
  shortTermListingId?: string | null;
}) {
  if (!isDealAnalyzerEnabled()) {
    return { ok: false as const, error: "Deal Analyzer is disabled" };
  }

  const steps: string[] = [];

  if (isDealAnalyzerCompsEnabled()) {
    const c = await runComparableAnalysis({ listingId: args.listingId });
    if (!c.ok) return c;
    steps.push("comparables");
  }

  if (isDealAnalyzerScenariosEnabled()) {
    const s = await runScenarioSimulation({
      listingId: args.listingId,
      financing: args.financing,
      shortTermListingId: args.shortTermListingId ?? null,
    });
    if (!s.ok) return s;
    steps.push("scenarios");
  }

  if (isDealAnalyzerBnhubModeEnabled() && args.shortTermListingId?.trim()) {
    const b = await runBnHubDealAnalysis({
      shortTermListingId: args.shortTermListingId.trim(),
      attachToListingId: args.listingId,
    });
    if (!b.ok) return b;
    steps.push("bnhub");
  }

  const d = await generateDealDecision({ listingId: args.listingId });
  if (!d.ok) return d;
  steps.push("decision");

  return { ok: true as const, steps };
}
