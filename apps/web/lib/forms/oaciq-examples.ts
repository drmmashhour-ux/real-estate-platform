export type OaciqExampleFormId =
  | "oaciq_bcp_v20_02_2023"
  | "oaciq_ppd_v18_06_2023"
  | "unknown";

export type OaciqFormAnalysis = {
  detectedFormId: OaciqExampleFormId;
  detectedLabel: string;
  confidence: "high" | "medium" | "low";
  version: string | null;
  sections: string[];
  autofillable: string[];
  reviewRequired: string[];
  notes: string[];
  filledPreview: OaciqFilledPreviewSection[];
};

export type OaciqFilledPreviewSection = {
  title: string;
  fields: Array<{
    label: string;
    value: string;
    status?: "filled" | "review";
  }>;
};

type ExampleDef = {
  id: Exclude<OaciqExampleFormId, "unknown">;
  label: string;
  signatureTerms: string[];
  version: string;
  sections: string[];
  autofillable: string[];
  reviewRequired: string[];
  sampleText: string;
  filledPreview: OaciqFilledPreviewSection[];
};

const EXAMPLES: ExampleDef[] = [
  {
    id: "oaciq_bcp_v20_02_2023",
    label: "Exclusive Brokerage Contract - Purchase (BCP)",
    signatureTerms: [
      "EXCLUSIVE BROKERAGE CONTRACT – PURCHASE",
      "CHIEFLY RESIDENTIAL IMMOVABLE CONTAINING LESS",
      "IDENTIFICATION OF THE BUYER",
      "DESIRED PRICE AND TERMS OF PURCHASE",
    ],
    version: "v20 02/2023",
    sections: [
      "Identification of agency or broker",
      "Identification of buyer",
      "Buyer identity verification",
      "Object and term of contract",
      "Essential features of the immovable",
      "Desired price and terms of purchase",
      "Remuneration",
      "Signatures",
    ],
    autofillable: [
      "Broker / agency legal identity",
      "Broker licence number",
      "Buyer names and contact details",
      "Target property description",
      "Desired purchase price",
      "Contract dates",
      "Signature place/date scaffolding",
    ],
    reviewRequired: [
      "ID document number and expiry",
      "Date of birth",
      "Profession or principal activity",
      "Remuneration selection",
      "Custom declarations",
      "All signatures",
    ],
    sampleText:
      "MANDATORY FORM EXCLUSIVE BROKERAGE CONTRACT – PURCHASE CHIEFLY RESIDENTIAL IMMOVABLE CONTAINING LESS THAN 5 DWELLINGS EXCLUDING CO-OWNERSHIP IDENTIFICATION OF THE BUYER DESIRED PRICE AND TERMS OF PURCHASE REMUNERATION SIGNATURES",
    filledPreview: [
      {
        title: "Broker and agency",
        fields: [
          { label: "Agency / broker", value: "LECIPM Real Estate Platform", status: "filled" },
          { label: "Broker representative", value: "Mohamed Al Mashhour", status: "filled" },
          { label: "OACIQ licence", value: "QA-LECIPM-1024", status: "review" },
        ],
      },
      {
        title: "Buyer identity",
        fields: [
          { label: "Buyer name", value: "Sarah Tremblay", status: "filled" },
          { label: "Email", value: "sarah.tremblay@example.com", status: "filled" },
          { label: "Phone", value: "+1 514 555 0147", status: "filled" },
          { label: "Current address", value: "825 Rue Sherbrooke O, Montreal, QC", status: "filled" },
        ],
      },
      {
        title: "Purchase mandate",
        fields: [
          { label: "Target city", value: "Montreal", status: "filled" },
          { label: "Property type", value: "Condo or plex under 5 dwellings", status: "filled" },
          { label: "Desired budget", value: "$620,000 CAD", status: "filled" },
          { label: "Contract term", value: "2026-04-01 to 2026-07-01", status: "filled" },
        ],
      },
      {
        title: "Manual review before final use",
        fields: [
          { label: "Government ID number", value: "To be verified in person", status: "review" },
          { label: "Date of birth", value: "To be confirmed", status: "review" },
          { label: "Remuneration clause", value: "Broker must confirm exact option selected", status: "review" },
          { label: "Signatures", value: "Buyer and broker signatures required", status: "review" },
        ],
      },
    ],
  },
  {
    id: "oaciq_ppd_v18_06_2023",
    label: "Promise to Purchase - Divided Co-Ownership (PPD)",
    signatureTerms: [
      "PROMISE TO PURCHASE – CO-OWNERSHIP",
      "IMMOVABLE HELD IN DIVIDED CO-OWNERSHIP",
      "SUMMARY DESCRIPTION OF THE IMMOVABLE",
      "PRICE AND DEPOSIT",
      "NEW HYPOTHECARY LOAN",
      "ANNEX Declarations by the seller of the immovable DSD",
    ],
    version: "v18 06/2023",
    sections: [
      "Identification of parties",
      "Object of the promise to purchase",
      "Summary description of the immovable",
      "Price and deposit",
      "Method of payment",
      "New hypothecary loan",
      "Inspection by buyer",
      "Review of documents by buyer",
      "Seller declarations and obligations",
      "Deed of sale and occupancy",
      "Inclusions and exclusions",
      "Annexes",
      "Conditions of acceptance",
      "Signatures and seller reply",
    ],
    autofillable: [
      "Buyer and seller names / contact details",
      "Broker identity in clause 2.1",
      "Condo unit address and city",
      "Parking and storage identifiers when known",
      "Purchase price and deposit framework",
      "Occupancy and deed target dates",
      "Annex references such as DSD / RIS / AF",
    ],
    reviewRequired: [
      "Tax applicability",
      "Deposit trustee details",
      "Financing conditions",
      "Inspection and waiver clauses",
      "Special assessment declarations",
      "Inclusions and exclusions",
      "Acceptance deadline",
      "Witness and signature blocks",
    ],
    sampleText:
      "MANDATORY FORM PROMISE TO PURCHASE – CO-OWNERSHIP FRACTION OF A CHIEFLY RESIDENTIAL IMMOVABLE HELD IN DIVIDED CO-OWNERSHIP SUMMARY DESCRIPTION OF THE IMMOVABLE PRICE AND DEPOSIT NEW HYPOTHECARY LOAN ANNEX Declarations by the seller of the immovable DSD",
    filledPreview: [
      {
        title: "Parties",
        fields: [
          { label: "Buyer", value: "Sarah Tremblay", status: "filled" },
          { label: "Seller", value: "Daniel Gagnon", status: "filled" },
          { label: "Buyer broker", value: "Mohamed Al Mashhour / LECIPM", status: "filled" },
        ],
      },
      {
        title: "Property summary",
        fields: [
          { label: "Address", value: "1200 Boul. Rene-Levesque O, Unit 2403, Montreal, QC", status: "filled" },
          { label: "Property type", value: "Divided co-ownership condo", status: "filled" },
          { label: "Parking", value: "P2-118", status: "filled" },
          { label: "Locker", value: "L-42", status: "filled" },
        ],
      },
      {
        title: "Offer economics",
        fields: [
          { label: "Purchase price", value: "$598,000 CAD", status: "filled" },
          { label: "Deposit", value: "$15,000 CAD within 24 hours", status: "filled" },
          { label: "Financing", value: "New hypothecary loan up to 80% LTV", status: "review" },
          { label: "Occupancy date", value: "2026-06-30", status: "filled" },
        ],
      },
      {
        title: "Annexes and legal review",
        fields: [
          { label: "DSD annex", value: "Included", status: "filled" },
          { label: "Financing annex AF", value: "Included", status: "filled" },
          { label: "Inspection clause", value: "Buyer review still required", status: "review" },
          { label: "Acceptance deadline", value: "Seller to confirm date/time", status: "review" },
        ],
      },
    ],
  },
];

export function getOaciqExampleLibrary() {
  return EXAMPLES.map((entry) => ({
    id: entry.id,
    label: entry.label,
    version: entry.version,
    sampleText: entry.sampleText,
    filledPreview: entry.filledPreview,
  }));
}

export function getOaciqFilledPreview(
  formId: OaciqExampleFormId
): OaciqFilledPreviewSection[] {
  return EXAMPLES.find((entry) => entry.id === formId)?.filledPreview ?? [];
}

export function analyzeOaciqFormText(rawText: string): OaciqFormAnalysis {
  const text = rawText.trim();
  const upper = text.toUpperCase();

  let best: ExampleDef | null = null;
  let bestHits = 0;
  for (const entry of EXAMPLES) {
    const hits = entry.signatureTerms.reduce(
      (count, term) => count + (upper.includes(term.toUpperCase()) ? 1 : 0),
      0
    );
    if (hits > bestHits) {
      bestHits = hits;
      best = entry;
    }
  }

  if (!best || bestHits === 0) {
    return {
      detectedFormId: "unknown",
      detectedLabel: "Unknown form",
      confidence: "low",
      version: null,
      sections: [],
      autofillable: [],
      reviewRequired: ["Manual review required until a matching template is added."],
      notes: ["No known OACIQ example signature matched the supplied text."],
      filledPreview: [],
    };
  }

  const confidence = bestHits >= Math.ceil(best.signatureTerms.length * 0.75) ? "high" : bestHits >= 2 ? "medium" : "low";

  return {
    detectedFormId: best.id,
    detectedLabel: best.label,
    confidence,
    version: best.version,
    sections: best.sections,
    autofillable: best.autofillable,
    reviewRequired: best.reviewRequired,
    notes: [
      `Matched ${bestHits} known signature markers for ${best.label}.`,
      "Use this as a review-first refill template, not a blind finalization path.",
    ],
    filledPreview: buildFilledPreviewFromText(best.id, rawText),
  };
}

function buildFilledPreviewFromText(
  formId: Exclude<OaciqExampleFormId, "unknown">,
  rawText: string
): OaciqFilledPreviewSection[] {
  if (formId === "oaciq_bcp_v20_02_2023") {
    return buildBcpPreview(rawText);
  }
  if (formId === "oaciq_ppd_v18_06_2023") {
    return buildPpdPreview(rawText);
  }
  return [];
}

function buildBcpPreview(rawText: string): OaciqFilledPreviewSection[] {
  const fallback = getOaciqFilledPreview("oaciq_bcp_v20_02_2023");
  const city = findFirst(rawText, [/\b(Montreal|Laval|Longueuil|Brossard|Quebec|Gatineau)\b/i]) ?? "Montreal";
  const money = findFirst(rawText, [/\$ ?[\d,\s]+(?:\.\d{2})?/, /\b\d{3}[,\s]\d{3}\b/]) ?? "$620,000";
  const email = findFirst(rawText, [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i]) ?? "client@example.com";
  const phone =
    findFirst(rawText, [/\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/]) ?? "+1 514 555 0101";

  return [
    {
      title: "Broker and agency",
      fields: [
        { label: "Agency / broker", value: "LECIPM Real Estate Platform", status: "filled" },
        { label: "Broker representative", value: "Mohamed Al Mashhour", status: "filled" },
        {
          label: "OACIQ licence",
          value: findFirst(rawText, [/\b[A-Z]{1,4}-?[A-Z0-9]{4,}\b/]) ?? fallback[0]?.fields[2]?.value ?? "To confirm",
          status: "review",
        },
      ],
    },
    {
      title: "Buyer identity",
      fields: [
        { label: "Buyer name", value: inferPersonName(rawText) ?? "Client name to confirm", status: "review" },
        { label: "Email", value: email, status: email === "client@example.com" ? "review" : "filled" },
        { label: "Phone", value: phone, status: phone.includes("555") ? "review" : "filled" },
        { label: "Current address", value: inferAddress(rawText) ?? "Address to confirm", status: "review" },
      ],
    },
    {
      title: "Purchase mandate",
      fields: [
        { label: "Target city", value: city, status: "filled" },
        {
          label: "Property type",
          value: /\bco-ownership|condo\b/i.test(rawText)
            ? "Condo / co-ownership"
            : "Residential immovable under 5 dwellings",
          status: "filled",
        },
        { label: "Desired budget", value: normalizeMoney(money), status: "filled" },
        {
          label: "Contract term",
          value: inferDateRange(rawText) ?? fallback[2]?.fields[3]?.value ?? "Term to confirm",
          status: "review",
        },
      ],
    },
    {
      title: "Manual review before final use",
      fields: [
        { label: "Government ID number", value: "Verify against original ID document", status: "review" },
        { label: "Date of birth", value: "Must be confirmed manually", status: "review" },
        { label: "Remuneration clause", value: "Broker must confirm selected remuneration option", status: "review" },
        { label: "Signatures", value: "Buyer and broker signatures required", status: "review" },
      ],
    },
  ];
}

function buildPpdPreview(rawText: string): OaciqFilledPreviewSection[] {
  const fallback = getOaciqFilledPreview("oaciq_ppd_v18_06_2023");
  const inferredAddress = inferAddress(rawText);
  const address: string = validAddress(inferredAddress)
    ? (inferredAddress ?? "Address to confirm")
    : fallback[1]?.fields[0]?.value ?? "Address to confirm";
  const moneyMatches = [...rawText.matchAll(/\$ ?\d[\d,\s]*(?:\.\d{2})?/g)]
    .map((match) => cleanExtract(match[0]))
    .filter((value) => /\d{3,}/.test(value));
  const purchasePrice = normalizeMoney(moneyMatches[0] ?? "$598,000");
  const deposit = normalizeMoney(moneyMatches[1] ?? "$15,000");
  const parking = findFirst(rawText, [/\bP(?:ARKING)?[-\s]?[A-Z0-9]{1,6}\b/i]) ?? "To confirm";
  const locker = findFirst(rawText, [/\bL(?:OCKER)?[-\s]?[A-Z0-9]{1,6}\b/i]) ?? "To confirm";
  const occupancy = findFirst(rawText, [/\b20\d{2}[/-]\d{2}[/-]\d{2}\b/, /\b\d{4}-\d{2}-\d{2}\b/]) ?? "To confirm";

  return [
    {
      title: "Parties",
      fields: [
        { label: "Buyer", value: validPersonName(inferPersonName(rawText)) ? inferPersonName(rawText)! : "Buyer to confirm", status: "review" },
        { label: "Seller", value: validPersonName(inferSecondPersonName(rawText)) ? inferSecondPersonName(rawText)! : "Seller to confirm", status: "review" },
        { label: "Buyer broker", value: "Mohamed Al Mashhour / LECIPM", status: "filled" },
      ],
    },
    {
      title: "Property summary",
      fields: [
        { label: "Address", value: address, status: address === "Address to confirm" ? "review" : "filled" },
        {
          label: "Property type",
          value: /\bdivided co-ownership|condo|co-ownership\b/i.test(rawText)
            ? "Divided co-ownership condo"
            : "Residential property",
          status: "filled",
        },
        { label: "Parking", value: parking, status: parking === "To confirm" ? "review" : "filled" },
        { label: "Locker", value: locker, status: locker === "To confirm" ? "review" : "filled" },
      ],
    },
    {
      title: "Offer economics",
      fields: [
        { label: "Purchase price", value: purchasePrice, status: "filled" },
        {
          label: "Deposit",
          value: deposit === "$15,000" ? `${deposit} within 24 hours` : deposit,
          status: "filled",
        },
        {
          label: "Financing",
          value: /\bhypothec|loan|financing\b/i.test(rawText)
            ? "Financing clause detected and must be reviewed"
            : "Financing terms to confirm",
          status: "review",
        },
        { label: "Occupancy date", value: occupancy, status: occupancy === "To confirm" ? "review" : "filled" },
      ],
    },
    {
      title: "Annexes and legal review",
      fields: [
        { label: "DSD annex", value: /\bDSD\b/i.test(rawText) ? "Included" : "Not clearly detected", status: /\bDSD\b/i.test(rawText) ? "filled" : "review" },
        { label: "Financing annex AF", value: /\bANNEX\b.*\bAF\b/i.test(rawText) || /\bAF\b/.test(rawText) ? "Included" : "To confirm", status: /\bAF\b/.test(rawText) ? "filled" : "review" },
        { label: "Inspection clause", value: /\binspection\b/i.test(rawText) ? "Inspection clause detected, buyer review required" : "Inspection terms to confirm", status: "review" },
        { label: "Acceptance deadline", value: "Seller to confirm date/time", status: "review" },
      ],
    },
  ];
}

function findFirst(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[0]) {
      return cleanExtract(match[0]);
    }
  }
  return null;
}

function inferPersonName(text: string) {
  const matches = [...text.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g)];
  return matches[0]?.[1] ? cleanExtract(matches[0][1]) : null;
}

function inferSecondPersonName(text: string) {
  const matches = [...text.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g)];
  return matches[1]?.[1] ? cleanExtract(matches[1][1]) : null;
}

function inferAddress(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const directLine = lines.find((line) => /\d+/.test(line) && /(rue|street|st\.|avenue|ave|boulevard|blvd|road|rd|chemin|boul\.)/i.test(line));
  if (directLine) return cleanExtract(directLine);

  const match = text.match(/\b\d{1,6}\s+[A-Za-z0-9'’.\- ]{3,80}(?:Rue|Street|St\.|Avenue|Ave|Boulevard|Blvd|Road|Rd|Chemin|Boul\.)[A-Za-z0-9'’.\- ]*/i);
  return match?.[0] ? cleanExtract(match[0]) : null;
}

function validPersonName(value: string | null) {
  if (!value) return false;
  const invalidTerms = [
    "civil code",
    "services tax",
    "mandatory form",
    "promise to purchase",
    "co-ownership",
    "quebec",
    "hypothecary loan",
  ];
  const lower = value.toLowerCase();
  if (invalidTerms.some((term) => lower.includes(term))) return false;
  return value.split(" ").length >= 2;
}

function validAddress(value: string | null) {
  if (!value) return false;
  const lower = value.toLowerCase();
  if (lower.includes("deposit") || lower.includes("clause") || lower.includes("promise to purchase")) {
    return false;
  }
  return /\d/.test(value) && /(rue|street|st\.|avenue|ave|boulevard|blvd|road|rd|chemin|boul\.)/i.test(value);
}

function inferDateRange(text: string) {
  const matches = text.match(/\b20\d{2}[/-]\d{2}[/-]\d{2}\b/g) ?? [];
  if (matches.length >= 2) {
    return `${matches[0]} to ${matches[1]}`;
  }
  return null;
}

function normalizeMoney(value: string) {
  const cleaned = cleanExtract(value).replace(/\s+/g, " ");
  return cleaned.startsWith("$") ? `${cleaned} CAD` : `$${cleaned} CAD`;
}

function cleanExtract(value: string) {
  return value.replace(/\s+/g, " ").replace(/[|]+/g, " ").trim();
}
