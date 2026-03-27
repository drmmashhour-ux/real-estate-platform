export function ExportPdfButton({ onExport }: { onExport: () => void }) {
  return (
    <button type="button" onClick={onExport} className="rounded-lg bg-[#C9A646] px-3 py-2 text-xs font-medium text-black hover:bg-[#E8C547]">
      Export PDF
    </button>
  );
}
