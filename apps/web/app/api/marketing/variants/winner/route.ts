import { NextRequest } from "next/server";
import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { marketingVariantWinnerBodySchema } from "@/lib/ai-marketing/schemas";
import { marketingJsonError, marketingJsonOk } from "@/lib/marketing/http-response";
import { markVariantWinner } from "@/lib/marketing/marketing-content-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = await requireAdminSurfaceApi();
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return marketingJsonError(400, "Invalid JSON", "INVALID_JSON");
  }

  const parsed = marketingVariantWinnerBodySchema.safeParse(json ?? {});
  if (!parsed.success) {
    return marketingJsonError(400, "Invalid input", "VALIDATION_ERROR");
  }

  try {
    await markVariantWinner(parsed.data.parentContentId, parsed.data.winningContentId);
    return marketingJsonOk({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.includes("Invalid")) {
      return marketingJsonError(400, msg, "INVALID_STATE");
    }
    console.error("[api/marketing/variants/winner]", e);
    return marketingJsonError(500, "Internal error", "INTERNAL");
  }
}
