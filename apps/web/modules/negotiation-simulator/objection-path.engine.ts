import type { NegotiationSimulatorContext, ObjectionPathForecast } from "./negotiation-simulator.types";

/**
 * Suggested next objection *themes* — not predictions. Explainable bands only.
 */
export function forecastObjectionPath(
  context: NegotiationSimulatorContext
): ObjectionPathForecast {
  const items: ObjectionPathForecast["likelyObjections"] = [];
  const push = (
    type: string,
    band: "low" | "medium" | "high",
    r: string[]
  ) => items.push({ type, probabilityBand: band, rationale: r });

  if (context.financingReadiness === "weak" || context.financingReadiness === "unknown") {
    push(
      "financing / qualification",
      context.financingReadiness === "weak" ? "high" : "medium",
      [
        context.financingReadiness === "weak"
          ? "Financing readiness is weak; related questions or hesitation may continue until clarified."
          : "Financing is not clearly strong; the client may raise timing or fit questions before committing.",
      ]
    );
  }

  if (context.priceSensitivity === "high" || context.priceSensitivity === "medium") {
    push(
      "price / value",
      context.priceSensitivity === "high" ? "high" : "medium",
      [
        "Price sensitivity is elevated; value framing and fit may need reinforcement before a smooth next step.",
      ]
    );
  }

  if (!context.visitCompleted) {
    push(
      "property fit / visit",
      "medium",
      [
        "If no visit (or clear alternative) is recorded, property-fit uncertainty may show up in conversation.",
      ]
    );
  }

  if (context.trustLevel === "low" || context.trustLevel === "unknown") {
    push(
      "reassurance / relationship",
      context.trustLevel === "low" ? "medium" : "low",
      [
        "Trust is not high; the client may seek reassurance, references, or clarity before moving forward.",
      ]
    );
  }

  if (Array.isArray(context.objections) && context.objections.length > 0) {
    push(
      "repeated prior themes",
      "medium",
      [
        "Existing recorded objections or concerns may reappear until addressed in a way the client accepts.",
      ]
    );
  }

  const { blockers } = context;
  if (Array.isArray(blockers) && blockers.length > 0) {
    const top = (blockers as { key?: string }[])[0];
    if (top?.key) {
      items.push({
        type: `blocker: ${String(top.key)}`,
        probabilityBand: blockers.length >= 2 ? "high" : "medium",
        rationale: ["Current blockers suggest related themes may resurface in the next exchange."],
      });
    }
  }

  if (items.length === 0) {
    items.push({
      type: "general follow-up or timing",
      probabilityBand: "low",
      rationale: [
        "Sparse data; no specific objection path is strongly indicated — use general discovery to surface concerns.",
      ],
    });
  }

  return { likelyObjections: items };
}
