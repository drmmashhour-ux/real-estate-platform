type Props = {
  document: { id: string; status: string; updatedAt: string } | null;
  property: string;
};

export function DocumentSummaryCard({ document, property }: Props) {
  if (!document) return <p className="text-xs text-slate-500">Select a document to review.</p>;
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Document summary</p>
      <p className="mt-1 text-xs text-slate-300">ID: {document.id}</p>
      <p className="text-xs text-slate-400">Property: {property}</p>
      <p className="text-xs text-slate-400">Status: {document.status}</p>
      <p className="text-xs text-slate-500">Updated: {new Date(document.updatedAt).toLocaleString()}</p>
    </div>
  );
}
