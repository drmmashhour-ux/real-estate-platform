import type { ThreeMonthProjection } from "@/modules/launch-simulation/launch-simulation.types";
import type { PitchDeckContent } from "@/modules/pitch-content/pitch-content.types";
import { exportSimulationMarkdown } from "./simulation-export.service";
import { pitchDeckToMarkdown } from "./pitch-export.service";
import type { FounderReportExportFormat } from "./founder-export.types";

export function buildFounderBriefingMarkdown(input: {
  projections: {
    conservative: ThreeMonthProjection;
    baseline: ThreeMonthProjection;
    optimistic: ThreeMonthProjection;
  };
  pitch: PitchDeckContent;
}): string {
  const sim = exportSimulationMarkdown(input.projections).body;
  const pitch = pitchDeckToMarkdown(input.pitch);
  return [
    "# LECIPM — founder briefing (projections + pitch copy)",
    "",
    "_All revenue figures are projected estimates, not actuals._",
    "",
    "---",
    "",
    sim,
    "---",
    "",
    pitch,
  ].join("\n");
}

export function buildFounderReportBundle(input: {
  projections: {
    conservative: ThreeMonthProjection;
    baseline: ThreeMonthProjection;
    optimistic: ThreeMonthProjection;
  };
  pitch: PitchDeckContent;
}): string {
  return JSON.stringify(
    {
      kind: "founder_report_bundle_v1",
      label: "projected_estimates_and_generated_copy_not_audited_financials",
      generatedAt: new Date().toISOString(),
      simulation: input.projections,
      pitch: input.pitch,
    },
    null,
    2
  );
}

export function buildFounderReportExport(
  format: FounderReportExportFormat,
  input: {
    projections: {
      conservative: ThreeMonthProjection;
      baseline: ThreeMonthProjection;
      optimistic: ThreeMonthProjection;
    };
    pitch: PitchDeckContent;
  }
): { contentType: string; filename: string; body: string } {
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "json_bundle") {
    return {
      contentType: "application/json; charset=utf-8",
      filename: `lecipm-founder-bundle-${stamp}.json`,
      body: buildFounderReportBundle(input),
    };
  }
  return {
    contentType: "text/markdown; charset=utf-8",
    filename: `lecipm-founder-briefing-${stamp}.md`,
    body: buildFounderBriefingMarkdown(input),
  };
}
