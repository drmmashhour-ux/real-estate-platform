"use client";

export function PPvsCPDiffPanel({ changedCount }: { changedCount: number }) {
  return (
    <p className="text-xs text-zinc-500">
      Mapper-level diff: {changedCount} field key(s) differ between PP and CP maps — verify official instruments.
    </p>
  );
}
