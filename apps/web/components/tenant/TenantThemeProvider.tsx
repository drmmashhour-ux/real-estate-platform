"use client";

import { type ReactNode, useEffect } from "react";

export type TenantBrandCss = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  customCss?: string | null;
};

export default function TenantThemeProvider({
  brand,
  children,
}: {
  brand?: TenantBrandCss | null;
  children: ReactNode;
}) {
  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty("--tenant-primary", brand?.primaryColor ?? "#D4AF37");
    root.style.setProperty("--tenant-secondary", brand?.secondaryColor ?? "#000000");
    root.style.setProperty("--tenant-accent", brand?.accentColor ?? "#ffffff");

    let styleTag = document.getElementById("tenant-custom-css");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "tenant-custom-css";
      document.head.appendChild(styleTag);
    }

    styleTag.textContent = brand?.customCss ?? "";
  }, [brand]);

  return <>{children}</>;
}
