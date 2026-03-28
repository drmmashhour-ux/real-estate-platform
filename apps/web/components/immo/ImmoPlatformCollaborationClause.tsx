/**
 * Broker-facing legal clause: ImmoContact traceability, no circumvention, compensation, remedies.
 * Use on CRM lead detail, broker settings, or agreement flows.
 */
export function ImmoPlatformCollaborationClause({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-premium-gold/20 bg-[#0B0B0B]/90 p-4 text-left text-[11px] leading-relaxed text-slate-300 shadow-inner shadow-black/40 ${className}`}
    >
      <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-premium-gold">
        Immo contact &amp; platform collaboration clause
      </h3>
      <p className="mt-3 text-slate-300">
        The Broker acknowledges that any initial contact initiated through the Platform between a user (buyer, tenant, or
        client) and a listing is recorded as an official platform-generated interaction (&quot;ImmoContact&quot;).
      </p>
      <p className="mt-3 font-medium text-slate-200">The Broker agrees that:</p>
      <ol className="mt-2 list-inside list-decimal space-y-1.5 text-slate-400">
        <li>Any communication initiated through the Platform is considered traceable and recorded.</li>
        <li>
          The Platform is recognized as the origin of the contact when the first interaction occurs through the
          Platform interface.
        </li>
        <li>
          Any subsequent communication, negotiation, or transaction resulting from such contact remains linked to the
          Platform.
        </li>
      </ol>
      <p className="mt-3 font-medium text-slate-200">The Broker agrees not to bypass the Platform by:</p>
      <ul className="mt-2 list-inside list-disc space-y-1.5 text-slate-400">
        <li>redirecting the client outside the Platform to avoid tracking</li>
        <li>conducting off-platform transactions derived from a Platform-originated contact</li>
      </ul>
      <p className="mt-3 font-medium text-slate-200">
        In the event that a transaction results from an ImmoContact, the Broker acknowledges that:
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1.5 text-slate-400">
        <li>the Platform may be entitled to compensation or a referral fee</li>
        <li>such compensation is governed by the applicable collaboration and commission terms</li>
      </ul>
      <p className="mt-3 font-medium text-slate-200">The Broker further agrees to:</p>
      <ul className="mt-2 list-inside list-disc space-y-1.5 text-slate-400">
        <li>cooperate in good faith</li>
        <li>maintain transparency in all Platform-related interactions</li>
        <li>respect all applicable legal and professional obligations</li>
      </ul>
      <p className="mt-3 font-medium text-slate-200">Failure to comply with this clause may result in:</p>
      <ul className="mt-2 list-inside list-disc space-y-1.5 text-slate-400">
        <li>suspension or termination of access</li>
        <li>enforcement of applicable contractual remedies</li>
      </ul>
      <p className="mt-4 border-t border-white/10 pt-3 text-slate-400">
        This clause ensures transparency, traceability, and fair collaboration between all parties.
      </p>
    </div>
  );
}
