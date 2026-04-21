import { NextResponse } from "next/server";
import { evaluateGreenEngine } from "@/modules/green/green.engine";
import type { RenoclimatFormDraft } from "@/modules/green-ai/form-assistant/form.types";
import { runFormAssistant } from "@/modules/green-ai/form-assistant/form-assistant.engine";
import { parseGreenDocumentRequestBody } from "@/modules/green-ai/documents/document-generator";

export const dynamic = "force-dynamic";

function mergeOverrides(body: Record<string, unknown>): Partial<RenoclimatFormDraft> | undefined {
  const keys = [
    "ownerName",
    "address",
    "municipality",
    "postalCode",
    "propertyType",
    "yearBuilt",
    "heatingSystem",
    "insulation",
    "windows",
    "additionalNotes",
  ] as const;
  const out: Partial<RenoclimatFormDraft> = {};
  let any = false;
  for (const k of keys) {
    const v = body[k];
    if (k === "yearBuilt" && typeof v === "number") {
      out.yearBuilt = v;
      any = true;
    } else if (k !== "yearBuilt" && typeof v === "string") {
      (out as Record<string, unknown>)[k] = v;
      any = true;
    }
  }
  const pu = body.plannedUpgrades;
  if (Array.isArray(pu)) {
    out.plannedUpgrades = pu.filter((x): x is string => typeof x === "string");
    any = true;
  }
  return any ? out : undefined;
}

/** POST — returns structured draft / validation / export (does not persist or submit externally). */
export async function POST(req: Request) {
  try {
    const body = ((await req.json()) as Record<string, unknown>) ?? {};
    const parsed = parseGreenDocumentRequestBody(body);
    const engine = evaluateGreenEngine(parsed.intake);
    const overrides = mergeOverrides(body);

    const meta = {
      ownerName:
        typeof body.ownerName === "string"
          ? body.ownerName
          : typeof body.owner_full_name === "string"
            ? body.owner_full_name
            : undefined,
      address:
        typeof body.address === "string"
          ? body.address
          : typeof body.mailAddress === "string"
            ? body.mailAddress
            : undefined,
      municipality:
        typeof body.municipality === "string"
          ? body.municipality
          : typeof body.city === "string"
            ? body.city
            : parsed.city ?? undefined,
      postalCode: typeof body.postalCode === "string" ? body.postalCode : undefined,
      additionalNotes: typeof body.additionalNotes === "string" ? body.additionalNotes : undefined,
    };

    const output = runFormAssistant({
      intake: parsed.intake,
      improvements: engine.improvements,
      overrides,
      meta,
    });

    return NextResponse.json(output);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
