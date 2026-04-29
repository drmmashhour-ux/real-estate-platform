import "server-only";

export async function generateMarketingFromTemplate(input: {
  templateKey: string;
  variables: Record<string, string>;
  createdById: string;
}): Promise<Record<string, unknown>> {
  void input.createdById;
  return {
    ok: true,
    templateKey: input.templateKey,
    title: "(stub)",
    body: `(stub rendered with keys: ${Object.keys(input.variables ?? {}).join(", ") || "none"})`,
    engine: "stub",
  };
}

export function generateListingDescriptionStub(input: {
  title: string;
  city: string;
  beds: number;
  baths: number;
  priceHint?: string;
  highlights: unknown[];
}): string {
  return [
    `${input.title} in ${input.city} (${input.beds} bed / ${input.baths} bath).`,
    input.priceHint ? `Near ${input.priceHint}.` : "",
    ...(Array.isArray(input.highlights) ? input.highlights.map(String) : []),
  ]
    .filter(Boolean)
    .join(" ");
}

export function listMarketingTemplateKeys(): string[] {
  return ["default", "minimal"];
}
