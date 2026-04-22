import Link from "next/link";

import { SoinsAccessibilityToggle } from "@/components/soins/SoinsAccessibilityToggle";
import { PLATFORM_NAME } from "@/lib/brand/platform";

export function SoinsHubHeader(props: {
  locale: string;
  country: string;
  /** e.g. /fr/ca/soins */
  hubBase: string;
  showHomeLink?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#D4AF37]/18 bg-black/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-4">
          <Link
            href={props.hubBase}
            className="font-serif text-xl font-semibold tracking-tight text-[#D4AF37] md:text-2xl"
          >
            Soins Hub
          </Link>
          <span className="hidden text-sm text-white/35 sm:inline">{PLATFORM_NAME}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SoinsAccessibilityToggle />
          {props.showHomeLink ? (
            <Link
              href={`/${props.locale}/${props.country}`}
              className="text-sm font-medium text-white/55 underline-offset-4 hover:text-[#D4AF37] hover:underline"
            >
              Accueil
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
