"use client";

import dynamic from "next/dynamic";

const OpenCanvaAdminButton = dynamic(
  () => import("./open-canva-button").then((m) => m.OpenCanvaAdminButton),
  { ssr: false }
);

export function AdminOpenCanvaButtonDynamic() {
  return <OpenCanvaAdminButton />;
}
