import { z } from "zod";

/**
 * Strict, versioned field specs — no free-form AI structure.
 * Add new versions with additive fields only (V8-safe).
 */
const formFieldSpecSchema = z.object({
  key: z.string().min(1),
  type: z.enum(["string", "number", "boolean", "date", "enum"]),
  required: z.boolean(),
  enumValues: z.array(z.string()).optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
});

export type ProductionGuardFormFieldSpec = z.infer<typeof formFieldSpecSchema>;

export const productionGuardFormDefinitionSchema = z.object({
  formKey: z.string().min(1),
  version: z.string().min(1),
  fields: z.array(formFieldSpecSchema).min(1),
  /** Legal / mandatory clause slots — AI output must preserve these keys if present in base. */
  immutableClauseKeys: z.array(z.string()).default([]),
});

export type ProductionGuardFormDefinition = z.infer<typeof productionGuardFormDefinitionSchema>;

const REGISTRY: Record<string, Record<string, ProductionGuardFormDefinition>> = {
  lecipm_promise_to_purchase: {
    "2026-04-01": {
      formKey: "lecipm_promise_to_purchase",
      version: "2026-04-01",
      immutableClauseKeys: ["jurisdiction_clause", "financing_condition_standard"],
      fields: [
        { key: "buyerLegalName", type: "string", required: true, minLength: 2, maxLength: 256 },
        { key: "sellerLegalName", type: "string", required: true, minLength: 2, maxLength: 256 },
        { key: "propertyCivicAddress", type: "string", required: true, minLength: 5, maxLength: 512 },
        { key: "offerPriceCents", type: "number", required: true },
        { key: "occupancyDate", type: "date", required: true },
        { key: "includesMovableProperty", type: "boolean", required: true },
        { key: "titleInsuranceRequested", type: "boolean", required: false },
        { key: "jurisdiction_clause", type: "string", required: true, minLength: 10, maxLength: 4000 },
        { key: "financing_condition_standard", type: "string", required: true, minLength: 10, maxLength: 8000 },
      ],
    },
  },
  lecipm_brokerage_ack: {
    "2026-04-01": {
      formKey: "lecipm_brokerage_ack",
      version: "2026-04-01",
      immutableClauseKeys: ["agency_relationship_summary"],
      fields: [
        { key: "brokerLicenseNumber", type: "string", required: true, minLength: 4, maxLength: 32 },
        { key: "agencyName", type: "string", required: true, minLength: 2, maxLength: 256 },
        { key: "agency_relationship_summary", type: "string", required: true, minLength: 20, maxLength: 8000 },
      ],
    },
  },
};

export function listRegisteredFormKeys(): string[] {
  return Object.keys(REGISTRY);
}

export function getFormDefinition(formKey: string, version: string): ProductionGuardFormDefinition | null {
  const byVersion = REGISTRY[formKey];
  if (!byVersion) return null;
  return byVersion[version] ?? null;
}

function zodForField(spec: ProductionGuardFormFieldSpec): z.ZodTypeAny {
  switch (spec.type) {
    case "string": {
      let s = z.string();
      if (spec.minLength != null) s = s.min(spec.minLength);
      if (spec.maxLength != null) s = s.max(spec.maxLength);
      return spec.required ? s : s.optional();
    }
    case "number":
      return spec.required ? z.number().finite() : z.number().finite().optional();
    case "boolean":
      return spec.required ? z.boolean() : z.boolean().optional();
    case "date":
      return spec.required ? z.union([z.string().min(1), z.date()]) : z.union([z.string(), z.date()]).optional();
    case "enum": {
      const vals = (spec.enumValues ?? []).filter((s) => s.length > 0);
      if (!vals.length) {
        return spec.required ? z.string().min(1) : z.string().optional();
      }
      const e = z.enum(vals as [string, ...string[]]);
      return spec.required ? e : e.optional();
    }
    default:
      return z.unknown();
  }
}

/**
 * Validates payload against the locked registry for `(formKey, version)`.
 * Rejects unknown keys when `strictKeys` is true (default in production).
 */
export function validateFormSchema(
  formKey: string,
  version: string,
  data: unknown,
  options?: { strictKeys?: boolean },
): { ok: true; data: Record<string, unknown> } | { ok: false; errors: string[] } {
  const def = getFormDefinition(formKey, version);
  if (!def) {
    return {
      ok: false,
      errors: [`Unknown form schema: ${formKey}@${version} (registry-only; no AI-generated structure).`],
    };
  }

  const parsedDef = productionGuardFormDefinitionSchema.safeParse(def);
  if (!parsedDef.success) {
    return { ok: false, errors: ["Internal form definition invalid"] };
  }

  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of def.fields) {
    shape[f.key] = zodForField(f);
  }

  const strictKeys = options?.strictKeys ?? process.env.PRODUCTION_MODE === "true";
  const objectSchema = strictKeys ? z.object(shape).strict() : z.object(shape).passthrough();

  const res = objectSchema.safeParse(data);
  if (!res.success) {
    return {
      ok: false,
      errors: res.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }

  return { ok: true, data: res.data as Record<string, unknown> };
}
