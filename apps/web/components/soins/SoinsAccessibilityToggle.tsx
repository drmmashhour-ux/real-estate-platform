"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "lecipm_soins_large_text";

export function useSoinsLargeText(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(false);

  useEffect(() => {
    try {
      setOn(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const set = (v: boolean) => {
    setOn(v);
    try {
      localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.dataset.soinsLargeText = v ? "true" : "false";
    }
  };

  useEffect(() => {
    document.documentElement.dataset.soinsLargeText = on ? "true" : "false";
  }, [on]);

  return [on, set];
}

export function SoinsAccessibilityToggle() {
  const [large, setLarge] = useSoinsLargeText();

  return (
    <button
      type="button"
      onClick={() => setLarge(!large)}
      className="rounded-full border border-[#D4AF37]/35 bg-black/60 px-4 py-2 text-sm font-medium text-[#FAFAF8] transition hover:border-[#D4AF37]/60"
      aria-pressed={large}
    >
      {large ? "Taille standard" : "Grande taille"}
    </button>
  );
}
