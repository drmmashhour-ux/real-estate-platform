"use client";

const GOLD = "#D4AF37";

export function AIApprovalBanner({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
      style={{ borderColor: `${GOLD}66`, backgroundColor: "#1a1508", color: "#f5e6b8" }}
    >
      <span>
        <strong className="text-white">{count}</strong> AI action{count === 1 ? "" : "s"} awaiting admin approval.
      </span>
      <a href="/ai/approvals" className="font-semibold underline-offset-2 hover:underline" style={{ color: GOLD }}>
        Review
      </a>
    </div>
  );
}
