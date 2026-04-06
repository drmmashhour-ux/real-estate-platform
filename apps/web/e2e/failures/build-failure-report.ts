import * as fs from "node:fs";
import * as path from "node:path";
import type { E2EFailureRecord } from "./types";

function reportsRoot(): string {
  return path.join(process.cwd(), "e2e", "reports");
}

function failuresDir(): string {
  return path.join(reportsRoot(), "failures");
}

function safeSlug(s: string): string {
  return s.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export function failureArtifactBasename(ctx: { scenarioSlug: string; timestamp: string }): string {
  const ts = ctx.timestamp.replace(/[:.]/g, "-").replace("T", "T").slice(0, 19);
  return `${ts}Z-${safeSlug(ctx.scenarioSlug)}`;
}

export function writeFailureArtifacts(record: E2EFailureRecord): { jsonPath: string; mdPath: string } {
  fs.mkdirSync(failuresDir(), { recursive: true });
  const base = failureArtifactBasename({ scenarioSlug: record.context.scenarioSlug, timestamp: record.context.timestamp });
  const jsonPath = path.join(failuresDir(), `${base}.json`);
  const mdPath = path.join(failuresDir(), `${base}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(record, null, 2), "utf8");

  const md = buildMarkdownReport(record);
  fs.writeFileSync(mdPath, md, "utf8");

  return { jsonPath, mdPath };
}

export function buildMarkdownReport(record: E2EFailureRecord): string {
  const c = record.context;
  const lines: string[] = [
    "# E2E Failure Report",
    "",
    `**Scenario:** ${c.scenarioName} (${c.scenarioSlug})`,
    `**Step:** ${c.stepName}`,
    `**Type:** ${record.type}`,
    `**Severity:** ${record.severity}`,
    "",
    "## Context",
    "",
    `- locale: ${c.locale}`,
    `- market: ${c.market}`,
    `- role: ${c.role}`,
    `- route: ${c.route ?? "—"}`,
    `- booking: ${c.bookingId ?? "—"}`,
    `- listing: ${c.listingId ?? "—"}`,
    `- payment mode: ${c.paymentMode ?? "—"}`,
    `- booking status: ${c.bookingStatus ?? "—"}`,
    `- manual payment status: ${c.manualPaymentStatus ?? "—"}`,
    `- API status: ${c.apiStatusCode ?? "—"}`,
    "",
    "## Error",
    "",
    "```",
    c.errorMessage,
    "```",
    "",
  ];

  if (c.apiBodySnippet) {
    lines.push("## Last API body (snippet)", "", "```", c.apiBodySnippet.slice(0, 4000), "```", "");
  }
  if (c.stackTrace) {
    lines.push("## Stack", "", "```", c.stackTrace.slice(0, 4000), "```", "");
  }

  lines.push(
    "## Likely root cause",
    "",
    record.likelyRootCause,
    "",
    "## Suggested fix",
    "",
    ...record.suggestedFixZones.map((z) => `- ${z}`),
    "",
    "## Files likely involved",
    "",
    ...record.filesLikelyInvolved.map((f) => `- \`${f}\``),
    "",
    "## Safe rerun conditions",
    "",
    record.safeRerunConditions,
    "",
    "## Rerun",
    "",
    record.rerunRecommended
      ? "Recommended after conditions above are met (prefer isolated booking/listing for payment scenarios)."
      : "Manual verification recommended before automated rerun (destructive or ambiguous state).",
    "",
  );

  return lines.join("\n");
}

export function logFailureToConsole(record: E2EFailureRecord): void {
  const c = record.context;
  console.log("");
  console.log("[E2E][FAILURE]");
  console.log(`Scenario: ${c.scenarioSlug}`);
  console.log(`Step: ${c.stepName}`);
  console.log(`Type: ${record.type}`);
  console.log(`Likely cause: ${record.likelyRootCause}`);
  console.log("Suggested fix zone:");
  for (const z of record.suggestedFixZones.slice(0, 6)) {
    console.log(`  - ${z}`);
  }
  console.log("Files likely involved:");
  for (const f of record.filesLikelyInvolved.slice(0, 8)) {
    console.log(`  - ${f}`);
  }
  console.log(`Rerun: ${record.rerunRecommended ? "recommended after fresh data / env fix" : "manual triage first"}`);
  console.log("");
}
