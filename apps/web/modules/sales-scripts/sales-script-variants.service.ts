import type { ScriptContext, SalesScriptVm, ScriptVariantKey } from "./sales-script.types";

function regionClause(region?: string): string | null {
  if (!region?.trim()) return null;
  return `In ${region.trim()}, we focus on density and response time — happy to show how alerts behave locally.`;
}

function adjustForTier(vm: SalesScriptVm, ctx: ScriptContext): SalesScriptVm {
  const tier = ctx.performanceTier ?? "average";
  if (ctx.audience !== "BROKER") return vm;

  if (tier === "top") {
    return {
      ...vm,
      hook: `${vm.hook} You move volume — we’ll keep the demo tight and senior-friendly.`,
      closing_line: `${vm.closing_line} If you prefer, we can include someone from product on the line.`,
    };
  }

  if (tier === "new") {
    return {
      ...vm,
      hook: `${vm.hook} We’ll keep jargon low — this is built to be usable week one.`,
      discovery_questions: [
        ...vm.discovery_questions,
        "What would “good enough to try” look like on your side?",
      ],
    };
  }

  return vm;
}

function adjustForPreviousInteraction(vm: SalesScriptVm, ctx: ScriptContext): SalesScriptVm {
  const prev = ctx.previousInteraction ?? "none";
  if (prev === "voicemail") {
    return {
      ...vm,
      opening_line: `${vm.opening_line} I left a quick voicemail — catching you live is better.`,
    };
  }
  if (prev === "not_now") {
    return {
      ...vm,
      opening_line: `${vm.opening_line} You mentioned timing — is this a better moment for two minutes?`,
    };
  }
  if (prev === "demo_set") {
    return {
      ...vm,
      opening_line: `${vm.opening_line} Confirming our demo — want to add anyone from your side?`,
    };
  }
  return vm;
}

function injectRegion(vm: SalesScriptVm, ctx: ScriptContext): SalesScriptVm {
  const rc = regionClause(ctx.region);
  if (!rc) return vm;
  return {
    ...vm,
    value_proposition: `${vm.value_proposition} ${rc}`,
  };
}

function pickVariantKey(ctx: ScriptContext): ScriptVariantKey {
  if (ctx.audience === "BROKER") {
    if (ctx.performanceTier === "top") return "top_broker";
    if (ctx.performanceTier === "new") return "junior_broker";
  }
  if (ctx.region && ["montreal", "mtl", "laval", "toronto", "gta"].includes(ctx.region.toLowerCase())) {
    return "high_trust_region";
  }
  if (ctx.previousInteraction && ctx.previousInteraction !== "none") return "follow_up_warm";
  return "default";
}

/**
 * Adaptive copy — tone and brevity only; does not invent metrics or guarantees.
 */
export function applyScriptVariant(vm: SalesScriptVm, ctx: ScriptContext): SalesScriptVm {
  let out = { ...vm };
  out = adjustForTier(out, ctx);
  out = adjustForPreviousInteraction(out, ctx);
  out = injectRegion(out, ctx);

  const variantKey = pickVariantKey(ctx);

  if (variantKey === "high_trust_region") {
    out = {
      ...out,
      hook: `${out.hook} Local routing is part of what we’ll show live.`,
    };
  }

  return out;
}

export function getVariantMetadata(ctx: ScriptContext): ScriptVariantKey {
  return pickVariantKey(ctx);
}
