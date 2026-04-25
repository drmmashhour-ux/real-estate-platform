import { 
  QuebecEsgResult, 
  QuebecEsgBreakdown, 
  QUEBEC_ESG_CRITERIA_DISCLAIMER 
} from "./quebec-esg.engine";
import { GreenEngineInput } from "@/modules/green/green.types";
import { greenAiLog } from "./green-ai-logger";

export interface QuebecEsgRecommendation {
  key: string;
  title: string;
  description: string;
  estimatedScoreLift: number;
  priority: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
  rationale: string[];
  relatedFactor: keyof QuebecEsgBreakdown;
}

export interface QuebecEsgRecommendationResult {
  recommendations: QuebecEsgRecommendation[];
}

function getPriority(score: number): "high" | "medium" | "low" {
  if (score < 56) return "high";
  if (score < 72) return "medium";
  return "low";
}

const RECOMMENDATION_MAP: Record<keyof QuebecEsgBreakdown, (input: GreenEngineInput, score: number) => QuebecEsgRecommendation | null> = {
  heating: (input, score) => {
    if (score >= 90) return null;
    const isOil = (input.heatingType ?? "").toLowerCase().includes("oil") || (input.heatingType ?? "").toLowerCase().includes("huile");
    return {
      key: "replace_heating_heat_pump",
      title: isOil ? "Replace oil heating with heat pump" : "Upgrade to high-efficiency heat pump",
      description: "Switching to an electric heat pump significantly reduces carbon footprint and improves energy efficiency in the Québec climate.",
      estimatedScoreLift: isOil ? 18 : 12,
      priority: getPriority(score),
      effort: "high",
      rationale: ["Electric heat pumps are ideal for Québec's low-carbon grid", "Reduces direct fossil fuel emissions"],
      relatedFactor: "heating"
    };
  },
  insulation: (input, score) => {
    if (score >= 80) return null;
    return {
      key: "upgrade_attic_insulation",
      title: "Upgrade attic and wall insulation",
      description: "Improving thermal resistance (R-value) in the attic and walls is the most cost-effective way to reduce heating costs.",
      estimatedScoreLift: 10,
      priority: getPriority(score),
      effort: "medium",
      rationale: ["Prevents heat loss during winter", "Stabilizes indoor temperature"],
      relatedFactor: "insulation"
    };
  },
  windows: (input, score) => {
    if (score >= 90) return null;
    return {
      key: "install_triple_glazed_windows",
      title: "Install double or triple glazed windows",
      description: "High-performance glazing reduces drafts and improves the thermal envelope of the building.",
      estimatedScoreLift: 8,
      priority: getPriority(score),
      effort: "high",
      rationale: ["Reduces energy loss through glass", "Improves acoustic comfort"],
      relatedFactor: "windows"
    };
  },
  energyEfficiency: (input, score) => {
    if (score >= 80) return null;
    return {
      key: "improve_airtightness",
      title: "Improve energy efficiency (airtightness + insulation)",
      description: "Sealing air leaks and optimizing energy use intensity improves the overall performance label.",
      estimatedScoreLift: 10,
      priority: getPriority(score),
      effort: "medium",
      rationale: ["Reduces uncontrolled air infiltration", "Lowers annual energy consumption"],
      relatedFactor: "energyEfficiency"
    };
  },
  materials: (input, score) => {
    if (score >= 80) return null;
    return {
      key: "sustainable_materials_retro",
      title: "Use sustainable materials for future renovations",
      description: "Prioritize low-VOC, recycled, or locally sourced materials for any upcoming interior or exterior work.",
      estimatedScoreLift: 6,
      priority: getPriority(score),
      effort: "medium",
      rationale: ["Reduces embodied carbon", "Improves indoor air quality"],
      relatedFactor: "materials"
    };
  },
  water: (input, score) => {
    if (score >= 80) return null;
    return {
      key: "water_saving_fixtures",
      title: "Install high-efficiency water fixtures",
      description: "Low-flow showerheads and faucets reduce hot water demand and overall water usage.",
      estimatedScoreLift: 5,
      priority: getPriority(score),
      effort: "low",
      rationale: ["Saves energy used for water heating", "Reduces municipal water load"],
      relatedFactor: "water"
    };
  },
  bonus: (input, score) => {
    if (score >= 80) return null;
    return {
      key: "solar_or_green_roof",
      title: "Add solar panels or green roof",
      description: "Transforming the roof into a productive asset adds significant sustainability value in urban areas like Montréal.",
      estimatedScoreLift: 7,
      priority: getPriority(score),
      effort: "high",
      rationale: ["Generates renewable energy onsite", "Reduces urban heat island effect"],
      relatedFactor: "bonus"
    };
  }
};

export function generateQuebecEsgRecommendations(
  input: GreenEngineInput, 
  evaluation: QuebecEsgResult
): QuebecEsgRecommendationResult {
  const recommendations: QuebecEsgRecommendation[] = [];

  const factors = Object.keys(evaluation.breakdown) as (keyof QuebecEsgBreakdown)[];

  for (const factor of factors) {
    const score = evaluation.breakdown[factor];
    const generator = RECOMMENDATION_MAP[factor];
    if (generator) {
      const rec = generator(input, score);
      if (rec) {
        recommendations.push(rec);
      }
    }
  }

  // Sort by estimatedScoreLift DESC
  recommendations.sort((a, b) => b.estimatedScoreLift - a.estimatedScoreLift);

  greenAiLog.info("quebec_esg_recommendations_generated", {
    count: recommendations.length,
    topRec: recommendations[0]?.key
  });

  return { recommendations };
}
