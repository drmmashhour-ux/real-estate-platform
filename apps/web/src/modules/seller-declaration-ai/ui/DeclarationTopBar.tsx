type Props = {
  progressPercent: number;
  onSave: () => void;
  onValidate: () => void;
  onPreview: () => void;
};

export function DeclarationTopBar({ progressPercent, onSave, onValidate, onPreview }: Props) {
  return (
    <div className="sticky top-0 z-20 rounded-xl border border-white/10 bg-[#0d0d0f]/95 p-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Seller Declaration AI</h2>
          <p className="text-xs text-slate-400">Structured drafting with controlled AI section assistance</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-premium-gold/40 bg-premium-gold/10 px-2.5 py-1 text-xs font-medium text-premium-gold">
            {progressPercent}% complete
          </span>
          <button type="button" onClick={onSave} className="rounded-lg bg-premium-gold px-3 py-2 text-xs font-medium text-black hover:bg-premium-gold">Save</button>
          <button type="button" onClick={onValidate} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white hover:bg-white/10">Validate</button>
          <button type="button" onClick={onPreview} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white hover:bg-white/10">Preview</button>
        </div>
      </div>
    </div>
  );
}
