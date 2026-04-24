"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

type Props = {
  href: string;
  actionKey: string;
  label?: string;
  className?: string;
  children: ReactNode;
};

export function CommandCenterTrackedLink(props: Props) {
  const router = useRouter();

  async function onNavigate(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    try {
      await fetch("/api/command-center/quick-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: props.actionKey,
          href: props.href,
          label: props.label,
        }),
      });
    } catch {
      /* still navigate */
    }
    router.push(props.href);
  }

  return (
    <a href={props.href} onClick={(e) => void onNavigate(e)} className={props.className}>
      {props.children}
    </a>
  );
}
