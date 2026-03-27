"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

/**
 * EN / FR toggle for legal and Canada/Quebec compliance.
 */
export function LangToggle() {
  const pathname = usePathname() ?? "";
  const isFr = pathname.startsWith("/fr/");
  const enPath = pathname.replace(/^\/fr/, "") || "/legal/terms";
  const frPath = pathname.startsWith("/fr/") ? pathname : `/fr${pathname}`;

  const active = "font-semibold text-[#C9A646]";
  const idle = "text-[#737373] hover:text-[#E8C547]";

  return (
    <div className="flex gap-2 text-sm">
      <Link href={enPath} className={!isFr ? active : idle}>
        EN
      </Link>
      <span className="text-[#444]">|</span>
      <Link href={frPath} className={isFr ? active : idle}>
        FR
      </Link>
    </div>
  );
}
