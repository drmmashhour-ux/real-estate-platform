type Props = {
  heading?: string;
  content: string;
};

export function LegalPacketAppendixSection({
  heading = "Appendix Snapshot",
  content,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-xl font-semibold text-white">{heading}</h2>
      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300">
        {content}
      </pre>
    </section>
  );
}
