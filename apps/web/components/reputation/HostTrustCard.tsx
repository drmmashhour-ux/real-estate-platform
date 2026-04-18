"use client";

export function HostTrustCard(props: {
  hostTrustScore: number;
  responseScore: number;
  cancellationScore: number;
  reviewScore: number;
  reasons: string[];
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-zinc-100">
      <h3 className="text-sm font-semibold">Host trust</h3>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{props.hostTrustScore}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
        <div>
          <dt>Response</dt>
          <dd className="text-zinc-200">{props.responseScore}</dd>
        </div>
        <div>
          <dt>Cancellation discipline</dt>
          <dd className="text-zinc-200">{props.cancellationScore}</dd>
        </div>
        <div>
          <dt>Review strength</dt>
          <dd className="text-zinc-200">{props.reviewScore}</dd>
        </div>
      </dl>
      <ul className="mt-3 space-y-1 text-xs text-zinc-500">
        {props.reasons.slice(0, 4).map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
