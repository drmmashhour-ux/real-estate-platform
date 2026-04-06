import type { DeclarationValidationResult } from "@/src/modules/seller-declaration-ai/domain/declaration.types";

type Props = {
  validation: DeclarationValidationResult | null;
};

function formatMode(mode: DeclarationValidationResult["representationMode"]) {
  if (mode === "broker") return "Sell with broker";
  if (mode === "fsbo") return "Sell by yourself";
  return "Path not selected";
}

function getNextSteps(validation: DeclarationValidationResult | null) {
  if (!validation) {
    return ["Add the property identity details to activate the correct declaration path."];
  }

  const steps: string[] = [];
  if (!validation.declarationVariant) {
    steps.push("Choose the property type and ownership path so the platform can determine DS or DSD.");
  }

  if (validation.knowledgeRuleBlocks.some((item) => item.toLowerCase().includes("property address"))) {
    steps.push("Add the full property address before moving forward.");
  }

  if (validation.knowledgeRuleBlocks.some((item) => item.toLowerCase().includes("property type"))) {
    steps.push("Set the property type to unlock the right seller declaration workflow.");
  }

  if (validation.warningFlags.some((item) => item.toLowerCase().includes("brokerage contract workflow"))) {
    steps.push("For brokered sales, start the brokerage-contract step before relying on the declaration as final-ready.");
  }

  if (validation.warningFlags.some((item) => item.toLowerCase().includes("contingency-fund"))) {
    steps.push("For condo or divided co-ownership, collect syndicate financials and contingency-fund context.");
  }

  if (validation.warningFlags.some((item) => item.toLowerCase().includes("lease details"))) {
    steps.push("If a tenant is in place, add the active lease details to complete the transaction file.");
  }

  if (!steps.length && validation.isValid) {
    steps.push("Declaration is structurally ready for review. Next stage is review, offer handling, and closing prep.");
  } else if (!steps.length) {
    steps.push("Finish the remaining required sections, then rerun validation.");
  }

  return steps.slice(0, 4);
}

export function DeclarationWorkflowGuideCard({ validation }: Props) {
  const nextSteps = getNextSteps(validation);

  return (
    <div className="rounded-xl border border-sky-400/20 bg-sky-500/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Seller workflow path</p>
          <p className="text-xs text-slate-300">
            The declaration path is derived from the pillar workflow rules and updates as the file becomes more complete.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-200">
            {validation?.declarationVariant ? `Declaration: ${validation.declarationVariant}` : "Declaration: pending"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-200">
            {formatMode(validation?.representationMode)}
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Workflow interpretation</p>
          <p className="mt-2 text-sm text-slate-200">
            {validation?.declarationVariant === "DSD"
              ? "This file is currently treated as a divided co-ownership transaction, so condo documents and financial context matter before final approval."
              : validation?.declarationVariant === "DS"
                ? "This file is currently treated as a standard DS-style seller disclosure path for residential or undivided ownership."
                : "The system needs a bit more identity data before it can safely decide which declaration workflow applies."}
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Next required steps</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-200">
            {nextSteps.map((step) => (
              <li key={step} className="rounded-md bg-white/5 px-2 py-1.5">
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
