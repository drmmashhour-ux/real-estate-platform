import type { ReactNode } from "react";
import Link from "next/link";
import { marketingType } from "@/config/typography";

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  /** If set, the whole card is a link to the feature detail page */
  href?: string;
};

export function FeatureCard({ icon, title, description, href }: Props) {
  const className =
    "group block h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-[#C9A646]/40 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A646]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

  const inner = (
    <>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#C9A646]/10 text-[#C9A646] transition group-hover:bg-[#C9A646]/15">
        {icon}
      </div>
      <h3 className={`${marketingType.cardTitle} mb-2`}>{title}</h3>
      <p className={`${marketingType.cardBody} mb-3`}>{description}</p>
      {href ? (
        <p className="text-xs font-semibold text-[#C9A646]/90 transition group-hover:text-[#C9A646]">
          Learn more <span aria-hidden>→</span>
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-label={`Learn more about ${title}`}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
