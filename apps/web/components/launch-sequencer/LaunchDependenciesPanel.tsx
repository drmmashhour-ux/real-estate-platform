import type { LaunchDependency } from "@/modules/launch-sequencer/launch-sequencer.types";

export function LaunchDependenciesPanel(props: { dependencies: LaunchDependency[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Dependencies &amp; gates</p>
      <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs">
        {props.dependencies.map((d) => (
          <li
            key={d.key}
            className={`rounded-lg border px-2 py-2 ${
              d.blocking ? "border-rose-500/35 bg-rose-950/15" : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <span className="font-medium text-neutral-200">{d.title}</span>
            <span className="text-neutral-500"> · {d.type}</span>
            {d.blocking ? <span className="ml-1 text-rose-300/90">(blocking)</span> : null}
            <p className="mt-1 text-[11px] text-neutral-500">{d.rationale[0]}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
