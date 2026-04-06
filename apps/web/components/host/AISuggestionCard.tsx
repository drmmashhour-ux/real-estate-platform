import Link from "next/link";

type Props = {
  title: string;
  body: string;
  actionLabel?: string;
  href?: string;
  onAction?: () => void;
};

export function AISuggestionCard({ title, body, actionLabel, href, onAction }: Props) {
  return (
    <div className="rounded-2xl border border-[#D4AF37]/35 bg-[#111] p-4 shadow-[0_0_0_1px_rgba(212,175,55,0.06)]">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-sm font-bold text-[#D4AF37]"
          aria-hidden
        >
          AI
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{body}</p>
          {actionLabel && (href || onAction) ? (
            <div className="mt-3">
              {href ? (
                <Link
                  href={href}
                  className="inline-flex rounded-lg border border-[#D4AF37]/50 px-3 py-1.5 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  {actionLabel}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onAction}
                  className="inline-flex rounded-lg border border-[#D4AF37]/50 px-3 py-1.5 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  {actionLabel}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
