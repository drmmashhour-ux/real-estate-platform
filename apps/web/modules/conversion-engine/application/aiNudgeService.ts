import { conversionCopy } from "@/src/design/conversionCopy";

export function buildAiNudges(input: {
  trustScore?: number | null;
  dealScore?: number | null;
  roiScore?: number | null;
  timeSpentSec?: number | null;
  repeatClicks?: number | null;
}) {
  const nudges: Array<{ title: string; body: string; tone: "positive" | "warning" | "neutral" }> = [];
  const trust = input.trustScore ?? 50;
  const deal = input.dealScore ?? 50;
  const roi = input.roiScore ?? deal;
  const timeSpent = input.timeSpentSec ?? 0;
  const repeatClicks = input.repeatClicks ?? 0;

  if (deal >= 75) nudges.push({ title: "High deal score", body: conversionCopy.nudges.afterAnalysis, tone: "positive" });
  if (trust <= 45) nudges.push({ title: "Low trust detected", body: "Verify documents and seller identity before making an offer.", tone: "warning" });
  if (roi >= 70) nudges.push({ title: "High ROI opportunity", body: conversionCopy.nudges.highValue, tone: "positive" });
  if (timeSpent > 120 && repeatClicks >= 2) {
    nudges.push({
      title: "You are revisiting this deal",
      body: "Save this listing and trigger a guided action plan to move from analysis to lead.",
      tone: "neutral",
    });
  }

  if (!nudges.length) {
    nudges.push({
      title: "Need a clearer signal?",
      body: conversionCopy.nudges.inactivity,
      tone: "neutral",
    });
  }
  return nudges.slice(0, 3);
}
