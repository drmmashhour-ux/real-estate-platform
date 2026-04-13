import { Cloud, Lock } from "lucide-react";

/** Infrastructure + payments trust copy for global footers (SEO / conversion). */
export function FooterTrustSignals({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`} role="group" aria-label="Security and payments">
      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[#B3B3B3]/85">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-premium-gold/55" strokeWidth={1.75} aria-hidden />
        <span>Secure payments powered by Stripe</span>
      </p>
      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[#B3B3B3]/85">
        <Cloud className="mt-0.5 h-3.5 w-3.5 shrink-0 text-premium-gold/55" strokeWidth={1.75} aria-hidden />
        <span>Platform protected by Cloudflare</span>
      </p>
    </div>
  );
}
