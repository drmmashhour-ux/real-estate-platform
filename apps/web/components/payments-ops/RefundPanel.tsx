"use client";

export function RefundPanel({ note }: { note?: string }) {
  return <p className="text-xs text-zinc-500">{note ?? "Refunds require authorized workflow and external settlement proof."}</p>;
}
