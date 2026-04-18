export function AssetBriefCard({ body }: { body: string }) {
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/45 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Brief médias</h3>
      <pre className="mt-2 whitespace-pre-wrap text-xs text-zinc-400">{body}</pre>
    </div>
  );
}
