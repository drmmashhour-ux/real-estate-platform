import { GreenEngineInput } from "@/modules/green/green.types";
import { evaluateQuebecEsg, QuebecEsgResult, QuebecEsgLabel } from "./quebec-esg.engine";
import { greenAiLog } from "./green-ai-logger";

export interface UpgradeSimulationResult {
  currentScore: number;
  projectedScore: number;
  delta: number;
  newLabel: QuebecEsgLabel;
  appliedRecommendations: string[];
}

export function simulateQuebecEsgUpgrade(
  input: GreenEngineInput,
  selectedRecommendationKeys: string[]
): UpgradeSimulationResult {
  const currentEval = evaluateQuebecEsg(input);
  
  // Clone input to avoid mutations
  const simulatedInput: GreenEngineInput = { ...input };

  for (const key of selectedRecommendationKeys) {
    switch (key) {
      case "replace_heating_heat_pump":
        simulatedInput.hasHeatPump = true;
        simulatedInput.heatingType = "electric_heat_pump";
        break;
      case "upgrade_attic_insulation":
        simulatedInput.atticInsulationQuality = "good";
        simulatedInput.wallInsulationQuality = "good";
        simulatedInput.insulationQuality = "good";
        break;
      case "install_triple_glazed_windows":
        simulatedInput.windowsQuality = "triple_high_performance";
        break;
      case "improve_airtightness":
        simulatedInput.energyConsumptionBand = "low";
        break;
      case "sustainable_materials_retro":
        simulatedInput.materialsProfile = "sustainable";
        break;
      case "water_saving_fixtures":
        simulatedInput.waterEfficiency = "high";
        break;
      case "solar_or_green_roof":
        simulatedInput.hasGreenRoof = true;
        simulatedInput.solarPvKw = (simulatedInput.solarPvKw || 0) + 5;
        break;
    }
  }

  const projectedEval = evaluateQuebecEsg(simulatedInput);

  const result: UpgradeSimulationResult = {
    currentScore: currentEval.score,
    projectedScore: projectedEval.score,
    delta: projectedEval.score - currentEval.score,
    newLabel: projectedEval.label,
    appliedRecommendations: selectedRecommendationKeys
  };

  greenAiLog.info("quebec_esg_simulation_run", {
    delta: result.delta,
    newLabel: result.newLabel
  });

  return result;
}
