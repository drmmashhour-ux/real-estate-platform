export function PublishReadinessCard({
  moderationOk,
  activeOk,
}: {
  moderationOk: boolean;
  activeOk: boolean;
}) {
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/45 p-4 text-sm text-zinc-300">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Prêt à publier (checklist)</h3>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        <li className={moderationOk ? "text-emerald-300/90" : "text-amber-200/80"}>
          Modération: {moderationOk ? "OK" : "À résoudre"}
        </li>
        <li className={activeOk ? "text-emerald-300/90" : "text-amber-200/80"}>
          Statut actif: {activeOk ? "OK" : "Inscription non ACTIVE"}
        </li>
      </ul>
    </div>
  );
}
