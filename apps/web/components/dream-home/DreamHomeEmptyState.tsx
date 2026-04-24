type Props = { message: string; onRefine?: () => void };

export function DreamHomeEmptyState({ message, onRefine }: Props) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-black/30 p-8 text-center">
      <p className="text-sm text-slate-300">{message}</p>
      {onRefine && (
        <button
          type="button"
          onClick={onRefine}
          className="mt-4 rounded-full border border-premium-gold/50 px-5 py-2 text-sm font-medium text-premium-gold hover:bg-premium-gold/10"
        >
          Refine my preferences
        </button>
      )}
    </div>
  );
}
