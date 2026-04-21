import type { ClassificationResult, EsgDocumentType } from "./esg-document-types";

type Rule = { type: EsgDocumentType; weight: number; patterns: RegExp[]; signals: string[] };

const RULES: Rule[] = [
  {
    type: "UTILITY_BILL",
    weight: 2,
    patterns: [
      /\bkwh\b/i,
      /\bbilling\s+period\b/i,
      /\belectricity\b/i,
      /\bnatural\s+gas\b/i,
      /\bgj\b/i,
      /\bm3\b/i,
      /\bwater\s+(usage|consumption)\b/i,
      /\bstatement\s+date\b/i,
      /\butility\b/i,
      /\binvoice\b.*\bkwh\b/i,
    ],
    signals: ["kWh", "billing period", "electricity", "natural gas"],
  },
  {
    type: "CERTIFICATION",
    weight: 3,
    patterns: [
      /\bleed\b/i,
      /\bwell\s+building\b/i,
      /\bboma\b/i,
      /\benergy\s*star\b/i,
      /\bcertif(ied|ication)\b/i,
      /\bplatinum\b|\bgold\b|\bsilver\b|\bbronze\b/i,
      /\bcertificate\s+number\b/i,
    ],
    signals: ["LEED", "WELL", "BOMA", "Energy Star", "certified"],
  },
  {
    type: "ENERGY_AUDIT",
    weight: 2,
    patterns: [
      /\benergy\s+audit\b/i,
      /\baudit\b.*\benergy\b/i,
      /\benergy\s+intensity\b/i,
      /\bretrofit\b/i,
      /\bbaseline\b/i,
      /\befficiency\s+recommendations?\b/i,
    ],
    signals: ["audit", "energy intensity", "retrofit"],
  },
  {
    type: "CLIMATE_PLAN",
    weight: 2,
    patterns: [
      /\bnet\s*[- ]?zero\b/i,
      /\bclimate\s+risk\b/i,
      /\bdecarbonization\b/i,
      /\broa?dmap\b/i,
      /\bghg\s+reduction\b/i,
      /\bclimate\s+(action|plan)\b/i,
    ],
    signals: ["net zero", "climate risk", "decarbonization", "roadmap"],
  },
  {
    type: "DECARBONIZATION_PLAN",
    weight: 2,
    patterns: [
      /\bdecarbonization\s+plan\b/i,
      /\bcarbon\s+neutral\b/i,
      /\bcapex\s+roadmap\b/i,
      /\bemissions?\s+reduction\s+target\b/i,
    ],
    signals: ["decarbonization plan", "carbon neutral"],
  },
  {
    type: "RENOVATION_REPORT",
    weight: 2,
    patterns: [
      /\brenovation\b/i,
      /\bretrofit\s+scope\b/i,
      /\benvelope\b.*\bupgrade\b/i,
      /\bhvac\b.*\bupgrade\b/i,
      /\blighting\s+upgrade\b/i,
      /\bdemolition\b|\breuse\b/i,
    ],
    signals: ["renovation", "retrofit scope"],
  },
  {
    type: "HVAC_REPORT",
    weight: 2,
    patterns: [
      /\bhvac\b/i,
      /\bventilation\b/i,
      /\bmechanical\s+systems?\b/i,
      /\bair\s+handling\b/i,
      /\brefrigerant\b/i,
    ],
    signals: ["HVAC", "ventilation"],
  },
  {
    type: "INSPECTION_REPORT",
    weight: 2,
    patterns: [
      /\binspection\s+report\b/i,
      /\bbuilding\s+inspection\b/i,
      /\bcondition\s+assessment\b/i,
      /\bdeficiencies?\b/i,
    ],
    signals: ["inspection report"],
  },
  {
    type: "ESG_DISCLOSURE",
    weight: 2,
    patterns: [
      /\besg\b/i,
      /\bsustainability\s+report\b/i,
      /\bemissions?\s+disclosure\b/i,
      /\bgovernance\b.*\bclimate\b/i,
      /\bscope\s*[123]\b/i,
      /\btcfd\b/i,
    ],
    signals: ["ESG", "sustainability report"],
  },
  {
    type: "BUILDING_PLAN",
    weight: 1,
    patterns: [
      /\bfloor\s+plan\b/i,
      /\bas[- ]?built\b/i,
      /\barchitectural\b/i,
      /\bdrawing\s+(set|number)\b/i,
    ],
    signals: ["floor plan", "as-built"],
  },
];

function scoreFilename(fileName: string): Partial<Record<EsgDocumentType, number>> {
  const lower = fileName.toLowerCase();
  const scores: Partial<Record<EsgDocumentType, number>> = {};
  const bump = (t: EsgDocumentType, n: number) => {
    scores[t] = (scores[t] ?? 0) + n;
  };
  if (/utility|bill|hydro|electric|gas|water/i.test(lower)) bump("UTILITY_BILL", 3);
  if (/leed|well|boma|energy.?star|certificat/i.test(lower)) bump("CERTIFICATION", 4);
  if (/audit|energy.?audit/i.test(lower)) bump("ENERGY_AUDIT", 3);
  if (/climate|decarbon|net.?zero|carbon/i.test(lower)) bump("CLIMATE_PLAN", 2);
  if (/renovat|retrofit/i.test(lower)) bump("RENOVATION_REPORT", 2);
  if (/hvac|ventilation|mechanical/i.test(lower)) bump("HVAC_REPORT", 2);
  if (/inspect/i.test(lower)) bump("INSPECTION_REPORT", 2);
  if (/esg|sustainability|tcfd/i.test(lower)) bump("ESG_DISCLOSURE", 2);
  if (/plan|drawing|floor/i.test(lower)) bump("BUILDING_PLAN", 1);
  return scores;
}

export function classifyDocument(input: {
  fileName: string;
  mimeType?: string | null;
  bodyText: string;
}): ClassificationResult {
  const text = `${input.fileName}\n${input.mimeType ?? ""}\n${input.bodyText}`.slice(0, 500_000);
  const lower = text.toLowerCase();

  const scores: Partial<Record<EsgDocumentType, number>> = {};
  const signals: string[] = [];

  for (const rule of RULES) {
    let hits = 0;
    for (const re of rule.patterns) {
      if (re.test(text)) hits += rule.weight;
    }
    if (hits > 0) {
      scores[rule.type] = (scores[rule.type] ?? 0) + hits;
      if (hits >= rule.weight) signals.push(...rule.signals.slice(0, 2));
    }
  }

  const fnScores = scoreFilename(input.fileName);
  for (const [t, n] of Object.entries(fnScores)) {
    scores[t as EsgDocumentType] = (scores[t as EsgDocumentType] ?? 0) + (n ?? 0);
  }

  let bestType: EsgDocumentType = "OTHER";
  let best = 0;
  for (const [t, s] of Object.entries(scores)) {
    if ((s ?? 0) > best) {
      best = s ?? 0;
      bestType = t as EsgDocumentType;
    }
  }

  /** High confidence only when multiple independent signals */
  let confidence = 0.35;
  if (best >= 8) confidence = 0.75;
  else if (best >= 5) confidence = 0.55;
  else if (best >= 3) confidence = 0.45;
  if (bestType !== "OTHER" && Object.keys(scores).filter((k) => (scores[k as EsgDocumentType] ?? 0) > 2).length >= 2) {
    /** Ambiguous: multiple types competing */
    confidence = Math.min(confidence, 0.5);
  }
  if (bestType === "OTHER" || best < 2) {
    confidence = Math.min(confidence, 0.35);
    if (bestType !== "OTHER" && best < 3) bestType = "OTHER";
  }

  return {
    documentType: bestType,
    confidence,
    signals: [...new Set(signals)].slice(0, 12),
  };
}
