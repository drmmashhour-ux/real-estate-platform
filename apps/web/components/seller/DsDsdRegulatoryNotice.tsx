/**
 * Educational notice: official OACIQ DS / DSD forms vs this platform’s FSBO declaration.
 * Does not constitute legal advice; summarizes publicly stated brokerage standards.
 */

const OACIQ_URL = "https://www.oaciq.com";

export function DsDsdRegulatoryNotice() {
  return (
    <details className="group rounded-xl border border-white/10 bg-[#141414] p-4 text-xs text-slate-400">
      <summary className="cursor-pointer list-none font-medium text-[#C9A646] outline-none [&::-webkit-details-marker]:hidden">
        <span className="underline decoration-[#C9A646]/40 decoration-dotted underline-offset-2 group-open:no-underline">
          Details &amp; Additional Declarations — regulatory context (DS / DSD brokerage forms vs this checklist)
        </span>
      </summary>
      <div className="mt-3 space-y-3 leading-relaxed">
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
          <a href={OACIQ_URL} target="_blank" rel="noopener noreferrer" className="text-[#C9A646] hover:underline">
            oaciq.com
          </a>
          {" — "}
          not legal advice; consult a courtier, notary, or lawyer for your file.
        </p>
      </div>
    </details>
  );
}
