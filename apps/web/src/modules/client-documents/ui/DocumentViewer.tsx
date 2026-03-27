type Props = {
  payload: Record<string, unknown>;
  highlightedKeys: string[];
  onExplain: (sectionKey: string) => void;
};

function groupBySection(payload: Record<string, unknown>) {
  const map = new Map<string, Array<[string, unknown]>>();
  for (const [k, v] of Object.entries(payload)) {
    const section = k.includes("_") ? k.split("_").slice(0, 2).join("_") : "general";
    const arr = map.get(section) ?? [];
    arr.push([k, v]);
    map.set(section, arr);
  }
  return Array.from(map.entries());
}

export function DocumentViewer({ payload, highlightedKeys, onExplain }: Props) {
  const sections = groupBySection(payload);
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Document</p>
      <div className="mt-2 space-y-3 text-xs">
        {sections.length ? sections.map(([section, fields]) => (
          <section key={section} className="rounded-lg border border-white/10 bg-black/30 p-2">
            <div className="mb-1 flex items-center justify-between">
              <p className="font-medium text-slate-200">{section.replace(/_/g, " ")}</p>
              <button type="button" onClick={() => onExplain(section)} className="text-[11px] text-[#C9A646] hover:underline">Explain</button>
            </div>
            <ul className="space-y-1">
              {fields.map(([k, v]) => (
                <li key={k} className={`rounded px-1 py-0.5 ${highlightedKeys.includes(k) ? "bg-amber-500/15 text-amber-100" : "text-slate-300"}`}>
                  <span className="text-slate-500">{k.replace(/_/g, " ")}:</span> {String(v ?? "")}
                </li>
              ))}
            </ul>
          </section>
        )) : <p className="text-slate-500">No document payload available.</p>}
      </div>
    </div>
  );
}
