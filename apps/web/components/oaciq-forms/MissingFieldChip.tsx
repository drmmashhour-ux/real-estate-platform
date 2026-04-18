"use client";

export function MissingFieldChip({ fieldKey }: { fieldKey: string }) {
  return (
    <span className="inline-flex max-w-full truncate rounded border border-ds-gold/30 bg-black/40 px-2 py-0.5 font-mono text-[10px] text-ds-gold/90">
      {fieldKey}
    </span>
  );
}
