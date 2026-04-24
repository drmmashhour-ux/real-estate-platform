import { NextResponse } from "next/server";
import { buildTurboDraft } from "@/modules/turbo-form-drafting/draftBuilder";
import { getFormTemplate } from "@/modules/turbo-form-drafting/formRegistry";
import { TurboDraftInput, TurboDraftResult } from "@/modules/turbo-form-drafting/types";
import { prefillTurboDraftFromListing, detectUserTurboRole } from "@/modules/turbo-form-drafting/prefill.service";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { logTurboDraftEvent } from "@/modules/turbo-form-drafting/auditLogger";
import { validateFormSchema, validateAIOutput } from "@/modules/production-guard/validationEngine";
import { logProductionAuditEvent, generateDiff } from "@/modules/production-guard/auditTrail";

export async function POST(req: Request) {
  const auth = await requireUser();
  const userId = auth.ok ? auth.user.id : undefined;
  const productionMode = process.env.PRODUCTION_MODE === "true";

  try {
    const body = await req.json();
    let input = body as TurboDraftInput;
    const draftId = body.draftId;

    // 1. Prefill if listingId provided
    if (body.listingId && body.listingKind && !draftId) {
      const prefill = await prefillTurboDraftFromListing({
        listingId: body.listingId,
        listingKind: body.listingKind,
        userId,
        role: body.role || "BUYER",
      });
      input = { ...input, ...prefill };
    }

  // 2. Role detection
  const detection = await detectUserTurboRole(userId);
  input.role = input.role || detection.role;
  input.representedStatus = input.representedStatus || detection.representedStatus;
  input.userId = userId;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // 3. Build the draft with AI/Engine
  let result: TurboDraftResult;
  try {
    result = await buildTurboDraft(input);
  } catch (err) {
    console.warn("[ProductionGuard] AI/Engine failure, falling back to base template:", err);
    // Fallback logic: create a barebones result from template
    const template = getFormTemplate(input.formKey);
    if (!template) throw new Error("Template missing");
    
    result = {
      draftId,
      formKey: input.formKey,
      title: template.title,
      sections: template.outputSections.map(id => ({ 
        id, 
        title: id, 
        content: `[Placeholder: ${id}] - Remplissez le formulaire pour générer le contenu.`,
        isMandatory: true 
      })),
      notices: [],
      risks: [],
      canProceed: false,
      blockingReasons: ["Échec de la génération intelligente. Veuillez remplir manuellement."],
    };
  }

  // 4. Production Hardening: Validate AI Output
  if (productionMode) {
    const aiValidation = validateAIOutput(result, input.formKey);
    if (!aiValidation.valid) {
      console.error("[ProductionGuard] AI output validation failed:", aiValidation.errors);
      // Fallback to base template logic or block
      return NextResponse.json({ 
        error: "AI output validation failed", 
        details: aiValidation.errors 
      }, { status: 400 });
    }
  }

  // 5. Save/Update to DB
  let draft;
  if (draftId) {
    // @ts-ignore
    const oldDraft = await prisma.turboDraft.findUnique({ where: { id: draftId } });
    if (!oldDraft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    if (oldDraft.userId !== userId && oldDraft.userId !== null) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const diff = generateDiff(oldDraft.contextJson, input);
    
    // @ts-ignore
    draft = await prisma.turboDraft.update({
      where: { id: draftId },
      data: {
        title: result.title,
        locale: input.locale || "fr",
        contextJson: input as any,
        resultJson: result as any,
        canProceed: result.canProceed,
        updatedAt: new Date(),
      },
    });

    await logProductionAuditEvent(draft.id, userId || null, "turbo_draft_updated", { diff, ip }, ip);
  } else {
    // @ts-ignore
    draft = await prisma.turboDraft.create({
      data: {
        userId: userId || null,
        formKey: input.formKey,
        title: result.title,
        locale: input.locale || "fr",
        contextJson: input as any,
        resultJson: result as any,
        canProceed: result.canProceed,
        status: "DRAFT",
      },
    });

    if (body.listingId) {
      await logTurboDraftEvent({
        draftId: draft.id,
        userId,
        eventKey: body.listingKind === "fsbo" ? "turbo_entry_fsbo" : "turbo_entry_listing",
        severity: "INFO",
        payload: { listingId: body.listingId, listingKind: body.listingKind, ip },
      });
    }

    await logTurboDraftEvent({
      draftId: draft.id,
      userId,
      eventKey: "turbo_draft_created",
      severity: "INFO",
      payload: { formKey: input.formKey, listingId: body.listingId, ip },
    });
  }

  result.draftId = draft.id;

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api:turbo-draft:build] error", err);
    return NextResponse.json({ error: "Failed to build draft" }, { status: 500 });
  }
}
