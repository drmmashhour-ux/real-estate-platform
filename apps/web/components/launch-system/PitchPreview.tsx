import type { InvestorSlide } from "@/modules/investor-pitch/slide-generator.service";

export function PitchPreview({ slides }: { slides: InvestorSlide[] }) {
  const preview = slides.slice(0, 3);
  return (
    <div className="space-y-4">
      {preview.map((s) => (
        <div key={s.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <h3 className="font-medium text-zinc-200">
            {s.id}. {s.title}
          </h3>
          <ul className="mt-2 list-inside list-disc text-sm text-zinc-400">
            {s.bullets.map((b) => (
              <li key={b.slice(0, 40)}>{b}</li>
            ))}
          </ul>
        </div>
      ))}
      <p className="text-xs text-zinc-600">Showing 3 of {slides.length} slides — full deck via API export.</p>
    </div>
  );
}
