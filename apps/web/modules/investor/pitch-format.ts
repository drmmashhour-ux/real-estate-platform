import { PLATFORM_NAME } from "@/lib/brand/platform";
import type { InvestorReadiness, PitchDeckContext, PitchSection } from "./pitch.types";

export function formatPitchAsMarkdown(
  sections: PitchSection[],
  title = `${PLATFORM_NAME} — Investor pitch`,
): string {
  const lines: string[] = [`# ${title}`, ""];
  for (const s of sections) {
    lines.push(`## ${s.title}`, "", s.content, "");
    for (const b of s.bullets) {
      lines.push(`- ${b}`);
    }
    lines.push("");
  }
  return `${lines.join("\n").trim()}\n`;
}

export function formatPitchAsPlainText(
  sections: PitchSection[],
  title = `${PLATFORM_NAME} — Investor pitch`,
): string {
  const lines: string[] = [title.toUpperCase(), "=".repeat(title.length), ""];
  for (const s of sections) {
    lines.push(s.title.toUpperCase(), "-".repeat(s.title.length), "", s.content, "");
    for (const b of s.bullets) {
      lines.push(`• ${b}`);
    }
    lines.push("");
  }
  return `${lines.join("\n").trim()}\n`;
}

export function assessInvestorReadiness(ctx: PitchDeckContext): {
  readiness: InvestorReadiness;
  risks: string[];
} {
  const risks: string[] = [];
  if (ctx.totalUsers < 50) risks.push("User base still early for institutional benchmarks.");
  if (ctx.revenue30d <= 0) risks.push("No trailing 30d revenue in RevenueEvent — clarify path to monetization.");
  if (ctx.totalListings < 10) risks.push("Listing supply is thin — stress-test liquidity narrative.");
  if (ctx.activeUsers30d < 20) risks.push("30d active users are low — emphasize roadmap and pipeline.");

  let readiness: InvestorReadiness = "LOW";
  if (ctx.totalUsers >= 200 && ctx.revenue30d > 0 && ctx.totalListings >= 20) readiness = "STRONG";
  else if (ctx.totalUsers >= 50 || ctx.revenue30d > 0 || ctx.totalListings >= 15) readiness = "MEDIUM";

  return { readiness, risks };
}
