"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export function MapRequiredSellForm({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action: (formData: FormData) => Promise<void>;
  className?: string;
}) {
  const t = useTranslations("Sell");

  return (
    <form
      className={cn(className)}
      action={action}
      onSubmit={(e) => {
        const fd = new FormData(e.currentTarget);
        const lat = String(fd.get("latitude") ?? "").trim();
        if (!lat) {
          e.preventDefault();
          window.alert(t("mapRequired"));
        }
      }}
    >
      {children}
    </form>
  );
}
