"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { readDemoDealsFromStorage, writeDemoDealsToStorage } from "@/lib/investment/demo-deals-storage";
import { useToast } from "@/components/ui/ToastProvider";

/**
 * After sign-in, push browser-saved (demo) deals from /analyze into the account. No full page reload.
 */
export function SyncDemoDealsOnLogin() {
  const router = useRouter();
  const { showToast } = useToast();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const all = readDemoDealsFromStorage();
      if (!all?.length) return;
      const toSync = all.filter((d) => d.source === "analyze");
      if (toSync.length === 0) return;

      let synced = 0;
      const failed: typeof toSync = [];
      for (const deal of toSync) {
        const res = await fetch("/api/investment-deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            propertyPrice: deal.propertyPrice,
            monthlyRent: deal.monthlyRent,
            monthlyExpenses: deal.monthlyExpenses,
            nightlyRate: deal.nightlyRate ?? 0,
            occupancyRate: deal.occupancyRate ?? 0,
            city: deal.city,
          }),
        });
        if (res.ok) synced += 1;
        else failed.push(deal);
      }

      const rest = all.filter((d) => d.source !== "analyze");
      writeDemoDealsToStorage([...rest, ...failed]);

      if (synced > 0) {
        showToast(`Synced ${synced} saved deal${synced === 1 ? "" : "s"} from this browser to your account`, "success");
        router.refresh();
      } else if (failed.length > 0) {
        showToast("Could not sync browser saves — try saving again from Analyze", "info");
      }
    };

    void run();
  }, [router, showToast]);

  return null;
}
