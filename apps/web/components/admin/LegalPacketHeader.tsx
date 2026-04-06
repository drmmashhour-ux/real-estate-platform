"use client";

import Link from "next/link";
import { PrintPageButton } from "@/components/ui/PrintPageButton";

type Props = {
  backHref: string;
  backLabel: string;
  title: string;
  description: string;
  jsonHref: string;
  jsonDownload: string;
  htmlHref: string;
  htmlDownload: string;
};

export function LegalPacketHeader({
  backHref,
  backLabel,
  title,
  description,
  jsonHref,
  jsonDownload,
  htmlHref,
  htmlDownload,
}: Props) {
  return (
    <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
      <div>
        <Link href={backHref} className="text-sm text-amber-400 hover:text-amber-300">
          {backLabel}
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <PrintPageButton label="Print legal packet" />
        <a
          href={jsonHref}
          download={jsonDownload}
          className="rounded-full border border-sky-500/30 px-4 py-2 text-sm text-sky-200 transition hover:bg-sky-500/10"
        >
          Download packet JSON
        </a>
        <a
          href={htmlHref}
          download={htmlDownload}
          className="rounded-full border border-fuchsia-500/30 px-4 py-2 text-sm text-fuchsia-200 transition hover:bg-fuchsia-500/10"
        >
          Download packet HTML
        </a>
      </div>
    </div>
  );
}
