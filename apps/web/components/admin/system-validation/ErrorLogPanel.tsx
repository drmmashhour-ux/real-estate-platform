"use client";

import type { ValidationError } from "@/src/modules/system-validation/types";

type Props = {
  errors: ValidationError[];
};

export function ErrorLogPanel({ errors }: Props) {
  if (!errors.length) {
    return (
      <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Error log</h2>
        <p className="mt-2 text-sm text-slate-500">No errors recorded.</p>
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
      <h2 className="text-lg font-semibold text-slate-100">Error log</h2>
      <ul className="mt-3 space-y-3 text-sm">
        {errors.map((e, i) => (
          <li key={i} className="rounded-lg border border-red-900/40 bg-red-950/20 p-3">
            <div className="font-medium text-red-200">{e.type}{e.flowId ? ` · ${e.flowId}` : ""}</div>
            <div className="mt-1 text-slate-300">{e.message}</div>
            {e.location ? <div className="mt-1 text-xs text-slate-500">{e.location}</div> : null}
            {e.reproduction?.length ? (
              <ol className="mt-2 list-decimal pl-4 text-xs text-slate-500">
                {e.reproduction.map((s, j) => (
                  <li key={j}>{s}</li>
                ))}
              </ol>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
