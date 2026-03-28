export function ExportPdfButton({ onExport }: { onExport: () => void }) {
  return (
    <button type="button" onClick={onExport} className="rounded-lg bg-premium-gold px-3 py-2 text-xs font-medium text-black hover:bg-premium-gold">
      Export PDF
    </button>
  );
}
