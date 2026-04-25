import { getBnhubEthicalTestimonials } from "@/lib/bnhub/bnhub-ethical-testimonials";

export function Testimonials({ className = "" }: { className?: string }) {
  const { host, guest } = getBnhubEthicalTestimonials();
  if (!host && !guest) {
    return (
      <div className={`rounded-2xl border border-white/10 bg-[#0A0A0A] px-6 py-10 text-center ${className}`}>
        <p className="text-sm text-white/50">
          Pilot stories will appear here once verified hosts and guests opt in to share a quote.
        </p>
      </div>
    );
  }
  return (
    <div className={`grid gap-6 md:grid-cols-2 ${className}`}>
      {host ? (
        <figure className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
          <blockquote className="text-sm leading-relaxed text-white/85">&ldquo;{host.quote}&rdquo;</blockquote>
          <figcaption className="mt-4 text-xs font-medium text-[#D4AF37]">Host — {host.attribution}</figcaption>
        </figure>
      ) : null}
      {guest ? (
        <figure className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
          <blockquote className="text-sm leading-relaxed text-white/85">&ldquo;{guest.quote}&rdquo;</blockquote>
          <figcaption className="mt-4 text-xs font-medium text-[#D4AF37]">Guest — {guest.attribution}</figcaption>
        </figure>
      ) : null}
    </div>
  );
}
