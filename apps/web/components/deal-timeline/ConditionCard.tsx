"use client";

export function ConditionCard({
  conditionType,
  status,
  deadline,
}: {
  conditionType: string;
  status: string;
  deadline?: string | null;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
      <p className="font-medium text-ds-text">{conditionType}</p>
      <p className="text-xs text-ds-text-secondary">Status: {status}</p>
      {deadline ? <p className="text-xs text-ds-text-secondary">Due: {new Date(deadline).toLocaleDateString()}</p> : null}
    </div>
  );
}
