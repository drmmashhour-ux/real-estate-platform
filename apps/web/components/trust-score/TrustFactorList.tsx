export function TrustFactorList(props: {
  title: string;
  items: string[];
  variant?: "positive" | "negative";
}) {
  const tone = props.variant === "negative" ? "text-rose-100/90" : "text-emerald-100/90";
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/90">{props.title}</p>
      <ul className={`mt-2 space-y-1 text-sm ${tone}`}>
        {props.items.length === 0 ?
          <li className="text-xs text-zinc-500">None surfaced in this snapshot.</li>
        : props.items.map((t, i) => (
            <li key={i} className="leading-snug">
              {t}
            </li>
          ))}
      </ul>
    </div>
  );
}
