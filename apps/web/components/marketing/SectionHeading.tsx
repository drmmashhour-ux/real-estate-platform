import type { ReactNode } from "react";
import { marketingType } from "@/config/typography";
import { platformBrandGoldTextClass } from "@/config/branding";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  align?: "left" | "center";
};

export function SectionHeading({ eyebrow, title, subtitle, align = "center" }: Props) {
  const a = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`mb-12 max-w-3xl ${a}`}>
      {eyebrow ? (
        <p className={`mb-2 ${marketingType.heroEyebrow} ${platformBrandGoldTextClass}`}>{eyebrow}</p>
      ) : null}
      <h2 className={`${marketingType.sectionTitle} text-white`}>{title}</h2>
      {subtitle ? <div className={marketingType.sectionSubtitle}>{subtitle}</div> : null}
    </div>
  );
}
