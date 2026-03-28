/**
 * Legal / product disclosure: platform-originated ImmoContact and collaboration framing.
 * Shown before Immo high-conversion chat continues.
 */
export function ImmoContactCollaborationNotice() {
  return (
    <div className="rounded-xl border border-premium-gold/25 bg-[#0B0B0B]/80 p-4 text-left shadow-inner shadow-black/40">
      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-premium-gold">
        Immo contact &amp; collaboration notice
      </h3>
      <p className="mt-3 rounded-lg border border-premium-gold/30 bg-premium-gold/10 px-3 py-2 text-[11px] font-medium leading-relaxed text-premium-gold">
        This contact will be recorded as a platform-generated interaction.
      </p>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-300">
        When a user initiates contact through the platform regarding a listing, this interaction is recorded as an
        official platform-generated contact (&quot;ImmoContact&quot;).
      </p>
      <p className="mt-3 text-[11px] font-medium text-slate-200">This means:</p>
      <ul className="mt-2 list-inside list-disc space-y-1.5 text-[11px] leading-relaxed text-slate-400">
        <li>The connection between the user and the listing broker originates from the platform</li>
        <li>The platform may act as a facilitator in the interaction</li>
        <li>The listing broker acknowledges that the contact was generated through the platform</li>
        <li>
          Any collaboration, communication, or transaction resulting from this contact is considered linked to the
          platform
        </li>
      </ul>
      <p className="mt-3 text-[11px] font-medium text-slate-200">This ensures:</p>
      <ul className="mt-2 list-inside list-disc space-y-1.5 text-[11px] leading-relaxed text-slate-400">
        <li>transparency of interactions</li>
        <li>proper tracking of client origin</li>
        <li>fair collaboration between parties</li>
      </ul>
      <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-slate-300">
        By continuing, you confirm that this contact is initiated through the platform and may be subject to applicable
        collaboration and commission terms.
      </p>
    </div>
  );
}
