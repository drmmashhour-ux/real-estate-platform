import { m } from "./marketing-ui-classes";

const INTERNAL = new Set([
  "internal_homepage",
  "internal_search_boost",
  "internal_email",
  "internal_destination",
  "internal_blog_feed",
]);

const EXPORT_CODES = new Set(["whatsapp_export", "pdf_brochure"]);

export function ChannelBadge({ code }: { code: string }) {
  const isInternal = INTERNAL.has(code);
  const isExport = EXPORT_CODES.has(code) || code.includes("export");
  const cls = isInternal
    ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
    : isExport
      ? "border-amber-500/40 bg-amber-950/30 text-amber-200"
      : "border-zinc-600 bg-zinc-800/80 text-zinc-300";
  return (
    <span className={`inline-flex max-w-full truncate rounded-lg border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {code.replace(/_/g, " ")}
      {!isInternal && !isExport ? (
        <span className="ml-1 text-[10px] uppercase text-zinc-500">mock</span>
      ) : null}
    </span>
  );
}
