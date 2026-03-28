"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

export function AnimatedReveal({ children, className = "", delayMs = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }
    const show = () => setVisible(true);
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          show();
          ob.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px 10% 0px" }
    );
    ob.observe(el);
    const t = window.setTimeout(() => {
      show();
      ob.disconnect();
    }, 2000);
    return () => {
      window.clearTimeout(t);
      ob.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className} ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
