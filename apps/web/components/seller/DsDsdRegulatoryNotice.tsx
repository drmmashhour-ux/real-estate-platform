/**
 * Educational notice: official OACIQ DS / DSD forms vs this platform’s FSBO declaration.
 * Does not constitute legal advice; summarizes publicly stated brokerage standards.
 */

const OACIQ_URL = "https://www.oaciq.com";

export function DsDsdRegulatoryNotice({
  variant,
}: {
  variant?: "DS" | "DSD";
}) {
  return (
    <details className="group rounded-xl border border-white/10 bg-[#141414] p-4 text-xs text-slate-400">
      <summary className="cursor-pointer list-none font-medium text-premium-gold outline-none [&::-webkit-details-marker]:hidden">
        <span className="underline decoration-premium-gold/40 decoration-dotted underline-offset-2 group-open:no-underline">
          Details &amp; Additional Declarations — regulatory context (DS / DSD brokerage forms vs this checklist)
        </span>
      </summary>
      <div className="mt-3 space-y-3 leading-relaxed">
        {variant ? (
          <p className="rounded-lg border border-premium-gold/20 bg-premium-gold/5 px-3 py-2 text-slate-300">
            Current path guidance: this file most closely matches the{" "}
            <strong className="text-premium-gold">{variant}</strong>{" "}
            disclosure track.
            {variant === "DSD"
              ? " Divided co-ownership requires stronger condo / syndicate financial context before the file is really complete."
              : " Standard residential or undivided ownership follows the DS-style disclosure track."}
          </p>
        ) : null}
        <p>
          Under Québec brokerage standards, the official{" "}
          <strong className="text-slate-300">Declarations by the seller of the immovable (DS)</strong> or, for divided
          co-ownership, the <strong className="text-slate-300">DSD</strong>, is a{" "}
          <strong className="text-slate-300">mandatory annex</strong> to an{" "}
          <strong className="text-slate-300">exclusive or non-exclusive brokerage contract to sell</strong> when a{" "}
          <strong className="text-slate-300">licensee</strong> represents the seller (including chiefly residential
          immovables with fewer than five dwellings for DS; DSD for divided co-ownership). The licensee must complete
          the form <strong className="text-slate-300">jointly with the owner</strong> and have it signed when the
          brokerage contract is signed.
        </p>
        <p>
          <strong className="text-slate-300">This platform checklist is not the official DS or DSD form.</strong> It
          supports transparency for FSBO listings and general disclosure practice. If you work with a licensed broker,
          they will use the official DS/DSD (and related annexes) as required; clause D15 (or the DSD equivalent) is
          where many clarifications and supporting details are recorded, and{" "}
          <strong className="text-slate-300">amendments</strong> to an existing DS/DSD may use the prescribed Amendments
          (AM) form, attached to the original declaration.
        </p>
        <p>
          If a seller <strong className="text-slate-300">refuses to complete and sign</strong> the official DS/DSD
          where it is mandatory, a licensee <strong className="text-slate-300">cannot</strong> enter into a brokerage
          contract with that client. Special rules may apply for legal persons, trusts, or mandataries—seek appropriate
          professional advice.
        </p>
        <p className="text-slate-500">
          Source: OACIQ professional standards (e.g. duty to verify, disclosure to parties).{" "}
          <a href={OACIQ_URL} target="_blank" rel="noopener noreferrer" className="text-premium-gold hover:underline">
            oaciq.com
          </a>
          {" — "}
          not legal advice; consult a courtier, notary, or lawyer for your file.
        </p>
      </div>
    </details>
  );
}
