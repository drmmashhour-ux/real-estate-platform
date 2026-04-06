"use client";

import { useTransition } from "react";
import { seedTemplateListingSeoDemo } from "./actions";

export function SeedTemplateDemoButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/20"
      onClick={() =>
        start(async () => {
          const r = await seedTemplateListingSeoDemo();
          if ("id" in r) window.location.reload();
          else alert(r.error);
        })
      }
    >
      {pending ? "Creating…" : "Generate template listing SEO (demo)"}
    </button>
  );
}
