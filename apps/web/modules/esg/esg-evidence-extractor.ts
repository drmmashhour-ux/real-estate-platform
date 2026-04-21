import type { EsgDocumentType, ExtractedFieldRecord } from "./esg-document-types";

function push(
  out: ExtractedFieldRecord[],
  rec: Omit<ExtractedFieldRecord, "extractionMethod"> & { extractionMethod?: ExtractedFieldRecord["extractionMethod"] }
) {
  out.push({
    extractionMethod: rec.extractionMethod ?? "RULES",
    ...rec,
  });
}

function numFromMatch(m: RegExpMatchArray | null, group = 1): number | null {
  if (!m?.[group]) return null;
  const n = parseFloat(m[group].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function extractFieldsForDocumentType(
  documentType: EsgDocumentType,
  bodyText: string,
  opts: { classificationConfidence: number }
): ExtractedFieldRecord[] {
  const text = bodyText.slice(0, 800_000);
  const lower = text.toLowerCase();
  const out: ExtractedFieldRecord[] = [];
  const baseConf = Math.min(0.95, Math.max(0.25, opts.classificationConfidence));

  switch (documentType) {
    case "UTILITY_BILL":
      extractUtility(text, lower, out, baseConf);
      break;
    case "CERTIFICATION":
      extractCert(text, lower, out, baseConf);
      break;
    case "ENERGY_AUDIT":
      extractAudit(text, lower, out, baseConf);
      break;
    case "RENOVATION_REPORT":
      extractRenovation(text, lower, out, baseConf);
      break;
    case "CLIMATE_PLAN":
    case "DECARBONIZATION_PLAN":
      extractClimate(text, lower, out, baseConf);
      break;
    case "HVAC_REPORT":
    case "INSPECTION_REPORT":
      extractHvacInspection(text, lower, out, baseConf);
      break;
    case "ESG_DISCLOSURE":
      extractDisclosure(text, lower, out, baseConf);
      break;
    case "BUILDING_PLAN":
      push(out, {
        fieldName: "buildingPlanPresent",
        fieldValueText: "true",
        verification: "UNCONFIRMED",
        confidence: baseConf * 0.6,
        note: "Architectural/plan signals detected — manual review suggested.",
      });
      break;
    default:
      push(out, {
        fieldName: "unclassifiedSignals",
        fieldValueText: text.slice(0, 400),
        verification: "UNCONFIRMED",
        confidence: 0.25,
        note: "OTHER — insufficient deterministic cues.",
      });
  }

  return out;
}

function extractUtility(text: string, lower: string, out: ExtractedFieldRecord[], baseConf: number) {
  const period =
    text.match(/billing\s+period\s*[:\s]+([^\n]+)/i) ??
    text.match(/(?:from|du)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(?:to|au|through)\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (period?.[0]) {
    push(out, {
      fieldName: "billingPeriod",
      fieldValueText: period[0].slice(0, 240),
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.55,
      note: "Parsed billing period line.",
    });
  }

  const kwh =
    numFromMatch(text.match(/([\d,]+\.?\d*)\s*kwh/i)) ??
    numFromMatch(text.match(/electricity[^0-9]{0,40}([\d,]+\.?\d*)\s*kwh/i));
  if (kwh != null) {
    push(out, {
      fieldName: "annualEnergyKwh",
      fieldValueText: String(kwh),
      fieldValueNumber: kwh,
      unit: "kWh",
      verification: "VERIFIED",
      confidence: Math.min(0.88, baseConf + 0.15),
      note: "Electricity consumption from keyword context.",
    });
  }

  const gj = numFromMatch(text.match(/([\d,]+\.?\d*)\s*gj\b/i));
  const gasM3 = numFromMatch(text.match(/([\d,]+\.?\d*)\s*m(?:³|3)\b/i));
  if (gj != null) {
    push(out, {
      fieldName: "annualGasGJ",
      fieldValueText: String(gj),
      fieldValueNumber: gj,
      unit: "GJ",
      verification: "VERIFIED",
      confidence: Math.min(0.85, baseConf + 0.1),
    });
  } else if (gasM3 != null) {
    push(out, {
      fieldName: "annualGasM3",
      fieldValueText: String(gasM3),
      fieldValueNumber: gasM3,
      unit: "m3",
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.65,
    });
  }

  const water = numFromMatch(text.match(/water[^0-9]{0,50}([\d,]+\.?\d*)\s*m(?:³|3)/i));
  if (water != null) {
    push(out, {
      fieldName: "annualWaterM3",
      fieldValueText: String(water),
      fieldValueNumber: water,
      unit: "m3",
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.6,
    });
  }

  const addr =
    text.match(/service\s+address\s*[:\s]+([^\n]+)/i)?.[1] ??
    text.match(/(\d{1,6}\s+[\w\s]{3,80}(?:street|st|avenue|ave|road|rd|boulevard|blvd)\b[^.\n]*)/i)?.[1];
  if (addr) {
    push(out, {
      fieldName: "serviceAddress",
      fieldValueText: addr.trim().slice(0, 500),
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.55,
    });
  }

  const provider =
    text.match(/^([A-Z][A-Za-z0-9 &'\-.]{2,60})\s+(?:inc|ltd|llp)\b/im)?.[0] ??
    (lower.includes("hydro") ? "Hydro" : null);
  if (provider) {
    push(out, {
      fieldName: "utilityProviderName",
      fieldValueText: typeof provider === "string" ? provider.slice(0, 120) : String(provider),
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.45,
    });
  }
}

function extractCert(text: string, lower: string, out: ExtractedFieldRecord[], baseConf: number) {
  let certType = "OTHER";
  if (/\bleed\b/i.test(text)) certType = "LEED";
  else if (/\bwell\b/i.test(text)) certType = "WELL";
  else if (/\bboma\b/i.test(text)) certType = "BOMA";
  else if (/energy\s*star/i.test(text)) certType = "ENERGY_STAR";

  const level =
    text.match(/\b(platinum|gold|silver|bronze|certified)\b/i)?.[1] ?? text.match(/\bleed\s+([\w\s]+)/i)?.[1];

  const issue = text.match(/(?:issue|effective)\s+date\s*[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1];
  const expiry =
    text.match(/(?:expir|valid\s+until)\s*[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1] ??
    text.match(/(\d{4}-\d{2}-\d{2})\s*(?:expiry|expiration)/i)?.[1];

  const certNum = text.match(/certificate\s*(?:no\.?|#)?\s*[:\s]*([A-Z0-9\-]{4,32})/i)?.[1];

  const certLike = /\bcertificate\b/i.test(text) && (certNum || issue);

  push(out, {
    fieldName: "certificationType",
    fieldValueText: certType,
    verification: certLike ? "VERIFIED" : "UNCONFIRMED",
    confidence: certLike ? Math.min(0.9, baseConf + 0.2) : baseConf * 0.5,
  });

  if (level) {
    push(out, {
      fieldName: "certificationLevel",
      fieldValueText: level.trim().slice(0, 64),
      verification: certLike ? "VERIFIED" : "UNCONFIRMED",
      confidence: certLike ? Math.min(0.88, baseConf + 0.15) : baseConf * 0.45,
    });
  }

  if (issue) {
    push(out, {
      fieldName: "certificationIssueDate",
      fieldValueText: issue,
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.55,
    });
  }

  if (expiry) {
    push(out, {
      fieldName: "certificationExpiryDate",
      fieldValueText: expiry,
      verification: certLike ? "VERIFIED" : "UNCONFIRMED",
      confidence: certLike ? Math.min(0.85, baseConf + 0.1) : baseConf * 0.45,
    });
  }

  const entity =
    text.match(/certified\s+(?:for|to)\s*[:\s]+([^\n]+)/i)?.[1] ??
    text.match(/project\s+name\s*[:\s]+([^\n]+)/i)?.[1];
  if (entity) {
    push(out, {
      fieldName: "certifiedEntityOrAddress",
      fieldValueText: entity.trim().slice(0, 400),
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.5,
    });
  }

  if (certNum) {
    push(out, {
      fieldName: "certificateNumber",
      fieldValueText: certNum,
      verification: certLike ? "VERIFIED" : "UNCONFIRMED",
      confidence: certLike ? Math.min(0.86, baseConf + 0.15) : baseConf * 0.45,
    });
  }
}

function extractAudit(text: string, lower: string, out: ExtractedFieldRecord[], baseConf: number) {
  const intensity = numFromMatch(text.match(/energy\s+intensity[^0-9]{0,30}([\d,]+\.?\d*)/i));
  const annual = numFromMatch(text.match(/annual[^0-9]{0,40}(?:energy|consumption)[^0-9]{0,40}([\d,]+\.?\d*)\s*kwh/i));

  if (annual != null) {
    push(out, {
      fieldName: "annualEnergyKwh",
      fieldValueText: String(annual),
      fieldValueNumber: annual,
      unit: "kWh",
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.62,
      note: "From audit narrative — confirm against utility data.",
    });
  }

  if (intensity != null) {
    push(out, {
      fieldName: "energyIntensity",
      fieldValueText: String(intensity),
      fieldValueNumber: intensity,
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.58,
    });
  }

  const retrofit = text.match(/(?:recommended|proposed)\s+retrofits?\s*[:\s]+([^\n]{10,800})/i)?.[1];
  if (retrofit) {
    push(out, {
      fieldName: "recommendedRetrofits",
      fieldValueText: retrofit.trim().slice(0, 2000),
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.55,
    });
  }

  const baseline = text.match(/baseline[^.\n]{10,600}/i)?.[0];
  if (baseline) {
    push(out, {
      fieldName: "baselinePerformanceNotes",
      fieldValueText: baseline.slice(0, 1200),
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.5,
    });
  }

  const obs = text.match(/(?:hvac|lighting|envelope)[^.]{10,400}/i)?.[0];
  if (obs) {
    push(out, {
      fieldName: "buildingSystemObservations",
      fieldValueText: obs.slice(0, 1200),
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.48,
    });
  }
}

function extractRenovation(text: string, lower: string, out: ExtractedFieldRecord[], baseConf: number) {
  const year = text.match(/\b(19|20)\d{2}\b/)?.[0];
  if (year) {
    push(out, {
      fieldName: "renovationYear",
      fieldValueText: year,
      fieldValueNumber: Number(year),
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.55,
    });
  }

  const scope = text.match(/scope[^.\n]{10,1200}/i)?.[0];
  if (scope) {
    push(out, {
      fieldName: "retrofitScope",
      fieldValueText: scope.slice(0, 1500),
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.52,
    });
  }

  push(out, {
    fieldName: "envelopeUpgrades",
    fieldValueText: /\benvelope\b/i.test(text) ? "mentioned" : "unknown",
    verification: "UNCONFIRMED",
    confidence: baseConf * 0.42,
  });
  push(out, {
    fieldName: "hvacUpgrades",
    fieldValueText: /\bhvac\b/i.test(text) ? "mentioned" : "unknown",
    verification: "UNCONFIRMED",
    confidence: baseConf * 0.42,
  });
  push(out, {
    fieldName: "lightingUpgrades",
    fieldValueText: /lighting/i.test(text) ? "mentioned" : "unknown",
    verification: "UNCONFIRMED",
    confidence: baseConf * 0.4,
  });

  const demo = /\bdemolition\b/i.test(text);
  const reuse = /\breuse|retrofit\b/i.test(text);
  push(out, {
    fieldName: "reuseVersusDemolitionSignal",
    fieldValueText: demo ? "demolition_language" : reuse ? "reuse_renovation_language" : "unclear",
    verification: "UNCONFIRMED",
    confidence: baseConf * 0.45,
  });

  push(out, {
    fieldName: "renovationEvidence",
    fieldValueText: "true",
    verification: /\brenovat|\bretrofit\b/i.test(text) ? "VERIFIED" : "ESTIMATED",
    confidence: /\brenovat|\bretrofit\b/i.test(text) ? Math.min(0.82, baseConf + 0.12) : baseConf * 0.35,
  });
}

function extractClimate(text: string, lower: string, out: ExtractedFieldRecord[], baseConf: number) {
  push(out, {
    fieldName: "hasClimateRiskPlan",
    fieldValueText: String(/\bclimate\s+risk\b|\badaptation\b|\bresilien/i.test(text)),
    verification: /\bclimate\s+risk\b/i.test(text) ? "VERIFIED" : "UNCONFIRMED",
    confidence: baseConf * 0.55,
  });

  push(out, {
    fieldName: "hasCapexDecarbPlan",
    fieldValueText: String(/\bcapex\b|\broa?dmap\b|\bdecarbon/i.test(text)),
    verification: /\bcapex\b.*\broa?dmap\b|\bdecarbon/i.test(text) ? "VERIFIED" : "ESTIMATED",
    confidence: baseConf * 0.52,
  });

  const targetYear = text.match(/\b20[3-9]\d\b/)?.[0];
  if (targetYear) {
    push(out, {
      fieldName: "decarbonTargetYear",
      fieldValueText: targetYear,
      fieldValueNumber: Number(targetYear),
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.48,
    });
  }

  const pct = numFromMatch(text.match(/([\d]{1,2}(?:\.\d)?)\s*%[^.\n]{0,40}(?:reduction|reduc|cut|decarbon)/i));
  if (pct != null) {
    push(out, {
      fieldName: "ghgReductionTargetPercent",
      fieldValueText: String(pct),
      fieldValueNumber: pct,
      unit: "%",
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.45,
    });
  }

  const capex = text.match(/capex[^.\n]{15,900}/i)?.[0];
  if (capex) {
    push(out, {
      fieldName: "capexRoadmapSnippet",
      fieldValueText: capex.slice(0, 1200),
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.5,
    });
  }

  const adapt = text.match(/(?:adaptation|resilien)[^.]{15,700}/i)?.[0];
  if (adapt) {
    push(out, {
      fieldName: "adaptationResilienceMeasures",
      fieldValueText: adapt.slice(0, 1200),
      verification: "UNCONFIRMED",
      confidence: baseConf * 0.52,
    });
  }
}

function extractHvacInspection(text: string, lower: string, out: ExtractedFieldRecord[], baseConf: number) {
  let vent: "low" | "medium" | "high" | "unknown" = "unknown";
  if (/\b(?:poor|inadequate)\s+vent/i.test(text)) vent = "low";
  else if (/\bgood\s+vent|adequate\s+airflow/i.test(text)) vent = "high";
  else if (/\bventilation\b/i.test(text)) vent = "medium";

  push(out, {
    fieldName: "ventilationQualitySignal",
    fieldValueText: vent,
    verification: vent === "unknown" ? "UNCONFIRMED" : "ESTIMATED",
    confidence: baseConf * 0.48,
  });

  const age = text.match(/(?:age|aged)\s+(?:of\s+)?(?:unit|equipment|system)?[^0-9]{0,20}(\d{1,2})\s*(?:years?|yrs?)/i)?.[1];
  if (age) {
    push(out, {
      fieldName: "equipmentAgeYearsBand",
      fieldValueText: `${age}+ years (approx)`,
      verification: "ESTIMATED",
      confidence: baseConf * 0.42,
    });
  }

  const maint = /\b(?:good|fair|poor)\s+(?:condition|maintenance)/i.exec(text)?.[0];
  if (maint) {
    push(out, {
      fieldName: "maintenanceCondition",
      fieldValueText: maint,
      verification: "ESTIMATED",
      confidence: baseConf * 0.45,
    });
  }

  const repl = /\b(?:replace|replacement\s+recommended|end\s+of\s+life)/i.test(text);
  push(out, {
    fieldName: "replacementRecommended",
    fieldValueText: repl ? "yes" : "no",
    verification: repl ? "ESTIMATED" : "UNCONFIRMED",
    confidence: baseConf * 0.43,
  });
}

function extractDisclosure(text: string, lower: string, out: ExtractedFieldRecord[], baseConf: number) {
  push(out, {
    fieldName: "emissionDisclosurePresent",
    fieldValueText: String(/\b(scope\s*[123]|ghg|emissions?\b)/i.test(text)),
    verification: "UNCONFIRMED",
    confidence: baseConf * 0.48,
  });
  push(out, {
    fieldName: "climateRiskLanguagePresent",
    fieldValueText: String(/\bclimate\s+risk\b|\btcfd\b/i.test(text)),
    verification: "UNCONFIRMED",
    confidence: baseConf * 0.46,
  });
  push(out, {
    fieldName: "governanceStatementSnippet",
    fieldValueText: text.match(/govern[^.\n]{20,500}/i)?.[0]?.slice(0, 800) ?? "",
    verification: "UNCONFIRMED",
    confidence: baseConf * 0.4,
  });
}
