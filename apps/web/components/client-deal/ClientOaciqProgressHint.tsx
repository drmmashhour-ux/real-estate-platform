import { lecipmOaciqFlags } from "@/config/feature-flags";

export function ClientOaciqProgressHint() {
  if (!lecipmOaciqFlags.residentialExecutionPipelineV1) return null;

  return (
    <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-left text-sm text-zinc-400">
      <p className="font-medium text-zinc-200">Your deal at a glance</p>
      <p className="mt-2 leading-relaxed">
        You will see signing steps and simple explanations here. Official OACIQ forms and legal advice always come from
        your broker and notary — LECIPM only helps track progress.
      </p>
    </div>
  );
}
