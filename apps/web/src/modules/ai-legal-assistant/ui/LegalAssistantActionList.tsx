type Props = { actions: string[] };

export function LegalAssistantActionList({ actions }: Props) {
  return (
    <ul className="space-y-1 text-xs text-slate-200">
      {actions.map((a) => <li key={a} className="rounded-md bg-white/5 px-2 py-1">{a}</li>)}
    </ul>
  );
}
