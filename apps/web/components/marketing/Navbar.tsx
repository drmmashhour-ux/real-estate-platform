"use client";

import Link from "next/link";
import { useState } from "react";
import { PLATFORM_NAME } from "@/config/branding";
import { marketingTheme } from "@/config/theme";
import { BuyingNavGroup } from "@/components/layout/BuyingNavGroup";
import { SellingNavGroup } from "@/components/layout/SellingNavGroup";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/demo", label: "Demo" },
];

const signupEnabled = process.env.NEXT_PUBLIC_SIGNUP_ENABLED === "1";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md"
      style={{ backgroundColor: `${marketingTheme.bg}e6` }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="font-serif text-xl font-semibold tracking-tight text-white">
          {PLATFORM_NAME}
        </Link>
        <nav className="hidden flex-wrap items-center gap-4 xl:gap-6 lg:flex">
          {links.slice(0, 1).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-300 transition hover:text-[#C9A646]"
            >
              {l.label}
            </Link>
          ))}
          <BuyingNavGroup mode="marketing-desktop" />
          <SellingNavGroup mode="marketing-desktop" />
          {links.slice(1).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-300 transition hover:text-[#C9A646]"
            >
              {l.label}
            </Link>
          ))}
          {signupEnabled ? (
            <Link
              href="/auth/register"
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              Sign up
            </Link>
          ) : null}
          <Link href="/auth/login" className="text-sm font-medium text-slate-400 transition hover:text-white">
            Login
          </Link>
          <Link
            href="/#cta"
            className="rounded-full bg-[#C9A646] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
          >
            Get Access
          </Link>
        </nav>
        <button
          type="button"
          className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open ? (
        <div className="border-t border-white/10 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {links.slice(0, 1).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-slate-200"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <BuyingNavGroup mode="marketing-mobile" onNavigate={() => setOpen(false)} />
            <SellingNavGroup mode="marketing-mobile" onNavigate={() => setOpen(false)} />
            {links.slice(1).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-slate-200"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            {signupEnabled ? (
              <Link href="/auth/register" className="text-sm text-slate-400" onClick={() => setOpen(false)}>
                Sign up
              </Link>
            ) : null}
            <Link href="/auth/login" className="text-sm text-slate-400" onClick={() => setOpen(false)}>
              Login
            </Link>
            <Link
              href="/#cta"
              className="rounded-full bg-[#C9A646] px-4 py-2 text-center text-sm font-semibold text-black"
              onClick={() => setOpen(false)}
            >
              Get Access
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
