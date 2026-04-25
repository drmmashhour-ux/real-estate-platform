import { NextResponse } from "next/server";
import { getAdminFormRefillSuggestions, type AdminFormId } from "@/lib/ai/refill-admin-form";

export const dynamic = "force-dynamic";

const VALID_FORM_IDS: AdminFormId[] = ["controls", "policies", "property-identities"];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const formId = body?.formId as string | undefined;
    const currentState = body?.currentState as Record<string, unknown> | undefined;

    if (!formId || !VALID_FORM_IDS.includes(formId as AdminFormId)) {
      return NextResponse.json(
        { error: "Invalid formId. Use: controls | policies | property-identities" },
        { status: 400 }
      );
    }

    const suggestions = await getAdminFormRefillSuggestions(
      formId as AdminFormId,
      currentState
    );
    return NextResponse.json(suggestions);
  } catch (e) {
    console.error("POST /api/admin/ai/refill-form:", e);
    return NextResponse.json(
      { error: "Failed to get AI refill suggestions" },
      { status: 500 }
    );
  }
}
