export type RuleAdjustmentSuggestion = {
  adjustmentType: string;
  label: string;
  suggestedAmountCents: number;
  direction: "plus" | "minus";
  rationale: string;
  confidence: number;
  sourceType: "rule_engine";
};

type BaseAdjustmentInput = {
  differences: Record<string, unknown>;
  comparable: Record<string, unknown>;
};

export function generateBaseAdjustmentSuggestions(input: BaseAdjustmentInput): RuleAdjustmentSuggestion[] {
  const adjustments: RuleAdjustmentSuggestion[] = [];

  const salePrice = (input.comparable.salePriceCents as number | undefined) ?? 0;
  const areaUnitValue =
    input.comparable.salePriceCents && input.comparable.buildingAreaSqft
      ? Math.round((input.comparable.salePriceCents as number) / (input.comparable.buildingAreaSqft as number))
      : 0;

  const areaDiff = input.differences.areaDiffSqft;
  if (typeof areaDiff === "number" && areaUnitValue > 0) {
    const amount = Math.abs(Math.round(areaDiff * areaUnitValue));
    if (amount > 0) {
      adjustments.push({
        adjustmentType: "area",
        label: "Living area adjustment",
        suggestedAmountCents: amount,
        direction: areaDiff > 0 ? "plus" : "minus",
        rationale: "Based on unit value derived from comparable sale price and building area.",
        confidence: 0.72,
        sourceType: "rule_engine",
      });
    }
  }

  const yearDiff = input.differences.yearBuiltDiff;
  if (typeof yearDiff === "number" && salePrice > 0 && yearDiff !== 0) {
    const amount = Math.round(Math.abs(yearDiff) * salePrice * 0.0025);
    if (amount > 0) {
      adjustments.push({
        adjustmentType: "time",
        label: "Age / effective year adjustment",
        suggestedAmountCents: amount,
        direction: yearDiff > 0 ? "plus" : "minus",
        rationale: "Heuristic time/age delta from year-built difference — verify against actual market evidence.",
        confidence: 0.58,
        sourceType: "rule_engine",
      });
    }
  }

  const conditionDiff = input.differences.conditionDiff;
  if (typeof conditionDiff === "number" && salePrice > 0 && conditionDiff !== 0) {
    const amount = Math.round(Math.abs(conditionDiff) * salePrice * 0.02);
    adjustments.push({
      adjustmentType: "condition",
      label: "Condition adjustment",
      suggestedAmountCents: amount,
      direction: conditionDiff > 0 ? "plus" : "minus",
      rationale: "Heuristic condition rating adjustment based on relative quality difference.",
      confidence: 0.62,
      sourceType: "rule_engine",
    });
  }

  const locationDiff = input.differences.locationDiff;
  if (typeof locationDiff === "number" && salePrice > 0 && locationDiff !== 0) {
    const amount = Math.round(Math.abs(locationDiff) * salePrice * 0.025);
    adjustments.push({
      adjustmentType: "location",
      label: "Location adjustment",
      suggestedAmountCents: amount,
      direction: locationDiff > 0 ? "plus" : "minus",
      rationale: "Heuristic location rating adjustment based on relative market appeal.",
      confidence: 0.6,
      sourceType: "rule_engine",
    });
  }

  const cornerLotDiff = input.differences.cornerLotDiff;
  if (typeof cornerLotDiff === "number" && salePrice > 0 && cornerLotDiff !== 0) {
    const amount = Math.round(salePrice * 0.015);
    adjustments.push({
      adjustmentType: "corner_lot",
      label: "Corner lot adjustment",
      suggestedAmountCents: amount,
      direction: cornerLotDiff > 0 ? "plus" : "minus",
      rationale: "Heuristic premium/discount for corner lot characteristic.",
      confidence: 0.55,
      sourceType: "rule_engine",
    });
  }

  const frontageDiff = input.differences.frontageDiff;
  if (typeof frontageDiff === "number" && frontageDiff !== 0 && salePrice > 0) {
    const amount = Math.round(Math.abs(frontageDiff) * 5000);
    adjustments.push({
      adjustmentType: "frontage",
      label: "Frontage adjustment",
      suggestedAmountCents: amount,
      direction: frontageDiff > 0 ? "plus" : "minus",
      rationale: "Heuristic frontage differential adjustment.",
      confidence: 0.52,
      sourceType: "rule_engine",
    });
  }

  const depthDiff = input.differences.depthDiff;
  if (typeof depthDiff === "number" && depthDiff !== 0 && salePrice > 0) {
    const amount = Math.round(Math.abs(depthDiff) * 2500);
    adjustments.push({
      adjustmentType: "depth",
      label: "Depth adjustment",
      suggestedAmountCents: amount,
      direction: depthDiff > 0 ? "plus" : "minus",
      rationale: "Heuristic lot depth differential adjustment.",
      confidence: 0.5,
      sourceType: "rule_engine",
    });
  }

  if (input.differences.sameShape === false && salePrice > 0) {
    adjustments.push({
      adjustmentType: "shape",
      label: "Lot shape adjustment",
      suggestedAmountCents: Math.round(salePrice * 0.01),
      direction: "minus",
      rationale: "Shape difference may influence utility and market appeal.",
      confidence: 0.45,
      sourceType: "rule_engine",
    });
  }

  if (input.differences.utilityDiff === true && salePrice > 0) {
    adjustments.push({
      adjustmentType: "utilities",
      label: "Utilities adjustment",
      suggestedAmountCents: Math.round(salePrice * 0.015),
      direction: "plus",
      rationale: "Utility/service difference may affect usability and marketability.",
      confidence: 0.48,
      sourceType: "rule_engine",
    });
  }

  return adjustments;
}
