import Link from "next/link";
import { LangToggle } from "./LangToggle";

type Props = {
  title: string;
  version?: string | null;
  updatedAt?: Date | null;
  children: React.ReactNode;
  backHref?: string;
  /** Premium LECIPM black + gold (default) or legacy light slate */
  variant?: "lecipm" | "light";
};

export function LegalPageLayout({
  title,
  version,
  updatedAt,
  children,
  backHref = "/",
  variant = "lecipm",
}: Props) {
  if (variant === "light") {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <Link href={backHref} className="text-sm font-medium text-slate-600 hover:text-slate-900">
              ← Back
            </Link>
            <div className="flex items-center gap-4">
              <LangToggle />
              <Link href="/legal" className="text-xs text-slate-500 hover:text-slate-700">
                Legal
              </Link>
            </div>
          </div>
        </header>
        <article className="mx-auto max-w-3xl px-4 py-8">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {(version || updatedAt) && (
            <p className="mt-2 text-sm text-slate-500">
              {version && <span>Version {version}</span>}
              {version && updatedAt && " · "}
              {updatedAt && <span>Last updated {new Date(updatedAt).toLocaleDateString()}</span>}
            </p>
          )}
          <div className="prose prose-slate mt-6 max-w-none prose-p:text-slate-700 prose-li:text-slate-700 prose-headings:text-slate-900">
            {children}
          </div>
        </article>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <header className="border-b border-[#C9A646]/25 bg-[#121212]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href={backHref}
            className="text-sm font-medium text-[#B3B3B3] transition-colors hover:text-[#C9A646]"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-4">
            <LangToggle />
            <Link href="/legal" className="text-xs font-semibold text-[#C9A646] hover:text-[#E8C547]">
              Legal center
            </Link>
          </div>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A646]">LECIPM · Mashhour Investments</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
        {(version || updatedAt) && (
          <p className="mt-3 text-sm text-[#737373]">
            {version && <span>Version {version}</span>}
            {version && updatedAt && " · "}
            {updatedAt && <span>Last updated {new Date(updatedAt).toLocaleDateString()}</span>}
          </p>
        )}
        <div
          className="prose prose-invert mt-8 max-w-none prose-headings:text-[#E8C547] prose-headings:font-semibold prose-p:text-[#D4D4D4] prose-p:leading-relaxed prose-li:text-[#D4D4D4] prose-a:text-[#C9A646] prose-strong:text-white prose-h2:mt-10 prose-h2:border-b prose-h2:border-[#C9A646]/20 prose-h2:pb-2"
        >
          {children}
        </div>
      </article>
    </main>
  );
}
