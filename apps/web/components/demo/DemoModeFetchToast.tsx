"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";

const MSG = "Demo environment — this action is disabled for safety";

/**
 * Surfaces DEMO_MODE API blocks (403 + code DEMO_MODE) as toasts instead of silent failures.
 */
export function DemoModeFetchToast() {
  const { showToast } = useToast();

  useEffect(() => {
    const orig = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await orig(input, init);
      if (res.status === 403) {
        void res
          .clone()
          .json()
          .then((data: unknown) => {
            if (
              data &&
              typeof data === "object" &&
              "code" in data &&
              (data as { code?: string }).code === "DEMO_MODE"
            ) {
              showToast(MSG, "warning");
            }
          })
          .catch(() => {});
      }
      return res;
    };
    return () => {
      window.fetch = orig;
    };
  }, [showToast]);

  return null;
}
