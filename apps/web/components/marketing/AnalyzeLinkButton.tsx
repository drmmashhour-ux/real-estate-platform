"use client";

import Link from "next/link";

type Props = {
  href?: string;
  /** Full visual + layout styles for the anchor (valid HTML — no nested button). */
  className: string;
  /** Optional base classes merged before `className` (e.g. inline sentence links). */
  linkClassName?: string;
  children: React.ReactNode;
};

/**
 * Navigation via Next.js Link only — single `<a>` (no nested `<button>`, which breaks clicks in browsers).
 */
export function AnalyzeLinkButton({ href = "/analyze", className, linkClassName, children }: Props) {
  const merged = [linkClassName, className].filter(Boolean).join(" ").trim();
  return (
    <Link href={href} className={merged || "relative z-30 inline-flex cursor-pointer"}>
      {children}
    </Link>
  );
}
