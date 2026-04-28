import type { Metadata } from "next";
import "./ultra-lite.css";
import { UltraLiteRibbon } from "@/components/lite/UltraLiteRibbon";
import { UltraLiteNav } from "@/components/lite/UltraLiteNav";

export const metadata: Metadata = {
  title: "Ultra-Lite · Hadiah Link",
  description: "Text-first mode for slow or metered networks.",
};

export default async function UltraLiteLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await props.params;
  const { children } = props;

  return (
    <div className="ultra-lite-shell">
      <UltraLiteRibbon litePath />
      <UltraLiteNav />
      <div className="ultra-lite-main">{children}</div>
    </div>
  );
}
