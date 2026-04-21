import type { GreenEngineInput } from "@/modules/green/green.types";
import type { GreenImprovement } from "@/modules/green/green.types";
import type { RenoclimatFormDraft } from "./form.types";

function insulationLabel(q: GreenEngineInput["insulationQuality"]): string {
  switch (q) {
    case "poor":
      return "Below typical code / needs upgrade";
    case "average":
      return "Average for era";
    case "good":
      return "Good — upgraded or high performance";
    case "unknown":
      return "Unknown — confirm during evaluation";
    default:
      return "";
  }
}

function windowsLabel(q: GreenEngineInput["windowsQuality"]): string {
  switch (q) {
    case "single":
      return "Single glazing";
    case "double":
      return "Double glazing";
    case "triple_high_performance":
      return "Triple / high-performance glazing";
    case "unknown":
      return "Unknown";
    default:
      return "";
  }
}

/** Maps platform intake + optional improvements into Rénoclimat-oriented draft fields. */
export function mapIntakeToRenoclimatForm(args: {
  intake: GreenEngineInput;
  improvements?: GreenImprovement[];
  ownerName?: string | null;
  address?: string | null;
  municipality?: string | null;
  postalCode?: string | null;
  additionalNotes?: string | null;
}): RenoclimatFormDraft {
  const heating =
    (args.intake.heatingType ?? "").trim() ||
    (args.intake.hasHeatPump ? "Cold-climate heat pump (declared)" : "");

  const upgradeLines =
    args.improvements && args.improvements.length > 0
      ? args.improvements.map((i) => i.action)
      : [];

  return {
    ownerName: (args.ownerName ?? "").trim(),
    address: (args.address ?? "").trim(),
    municipality: args.municipality?.trim() || undefined,
    postalCode: args.postalCode?.trim() || undefined,
    propertyType: (args.intake.propertyType ?? "").trim(),
    yearBuilt: args.intake.yearBuilt ?? undefined,
    heatingSystem: heating,
    insulation: insulationLabel(args.intake.insulationQuality),
    windows: windowsLabel(args.intake.windowsQuality),
    plannedUpgrades: upgradeLines,
    additionalNotes: args.additionalNotes?.trim() || undefined,
  };
}
