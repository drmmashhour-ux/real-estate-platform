import { getPlatformAppUrl } from "@/lib/platform-url";

export function PlatformAccessSection() {
  const platformUrl = getPlatformAppUrl();

  return (
    <section
      id="platform-access"
      className="relative overflow-hidden bg-[#0F3D2E]/30 py-28 md:py-36"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212, 175, 55,0.08)_0%,_transparent_55%)]" />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-serif text-3xl text-white md:text-4xl">Enter the Platform</h2>
        <p className="mt-4 text-[#CCCCCC]">
          Sign in to the full prop-tech workspace — listings, analytics, and deal tools in one
          secure environment.
        </p>
        <a
          href={platformUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex items-center justify-center rounded-lg bg-[#D4AF37] px-12 py-4 text-base font-semibold text-[#0B0B0B] shadow-[0_12px_40px_rgba(212, 175, 55,0.35)] transition hover:bg-[#D4AF37]"
        >
          Access Platform
          <span className="ml-3 text-[10px] font-normal uppercase tracking-[0.25em] text-[#0B0B0B]/70">
            Next.js app ↗
          </span>
        </a>
        <p className="mt-4 break-all text-xs text-[#CCCCCC]/45">{platformUrl}</p>
      </div>
    </section>
  );
}
