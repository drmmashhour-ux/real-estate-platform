export function SEOCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/45 p-4 text-sm">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">SEO (brouillon)</h3>
      <p className="mt-2 text-amber-100/90">{title}</p>
      <p className="mt-1 text-xs text-zinc-400">{description}</p>
    </div>
  );
}
