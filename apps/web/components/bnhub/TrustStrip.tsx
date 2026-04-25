const ITEMS = ["Verified listings", "Smart recommendations", "Transparent pricing"] as const;

export function TrustStrip() {
  return (
    <div className="border-y border-white/[0.08] bg-black py-10 sm:py-12">
      <div className="mx-auto flex max-w-4xl flex-col items-stretch gap-5 px-4 sm:flex-row sm:items-center sm:justify-center sm:gap-x-10 md:gap-x-14">
        {ITEMS.map((label) => (
          <div
            key={label}
            className="flex min-h-[52px] items-center justify-center gap-3 text-sm font-medium tracking-wide text-white/90 sm:min-h-0 sm:justify-start sm:text-base"
          >
            <span className="text-lg text-[#D4AF37]" aria-hidden>
              ✔
            </span>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
