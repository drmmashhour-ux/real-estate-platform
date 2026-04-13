"use client";

export function RequestCard({
  dealId,
  request,
  canValidate,
}: {
  dealId: string;
  request: {
    id: string;
    title: string;
    status: string;
    requestCategory: string;
    dueAt: string | null;
    items: { id: string; itemLabel: string; status: string }[];
  };
  canValidate: boolean;
}) {
  return (
    <li className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-100">{request.title}</p>
          <p className="text-xs text-slate-500">
            {request.requestCategory} · {request.status}
            {request.dueAt ? ` · due ${request.dueAt.slice(0, 10)}` : ""}
          </p>
        </div>
      </div>
      <RequestItemChecklist dealId={dealId} requestId={request.id} items={request.items} canValidate={canValidate} />
    </li>
  );
}

function RequestItemChecklist({
  dealId,
  requestId,
  items,
  canValidate,
}: {
  dealId: string;
  requestId: string;
  items: { id: string; itemLabel: string; status: string }[];
  canValidate: boolean;
}) {
  async function validate(itemId: string) {
    await fetch(
      `/api/deals/${encodeURIComponent(dealId)}/requests/${encodeURIComponent(requestId)}/items/${encodeURIComponent(itemId)}/validate`,
      {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "VALIDATED" }),
      }
    );
    window.location.reload();
  }

  return (
    <ul className="mt-2 space-y-1 text-sm text-slate-400">
      {items.map((i) => (
        <li key={i.id} className="flex flex-wrap items-center justify-between gap-2">
          <span>
            {i.itemLabel} — <span className="text-slate-300">{i.status}</span>
          </span>
          {canValidate && i.status !== "VALIDATED" ? (
            <button
              type="button"
              className="text-xs text-amber-400 hover:underline"
              onClick={() => void validate(i.id)}
            >
              Mark validated
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
