import Link from "next/link";
import {
  PLATFORM_COPYRIGHT_LINE,
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_NAME,
} from "@/config/branding";
import { getPublicContactEmail, getPublicContactMailto } from "@/lib/marketing-contact";

/** Site footer — shared across marketing surfaces. */
export function Footer() {
  const year = new Date().getFullYear();
  const contactEmail = getPublicContactEmail();
  const mailto = getPublicContactMailto();
  return (
    <footer className="border-t border-white/10 bg-black/30 px-4 py-14 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:justify-between">
        <div>
          <p className="font-serif text-xl font-semibold text-white">{PLATFORM_NAME}</p>
          <p className="mt-1 text-sm text-[#C9A646]/90">{PLATFORM_CARREFOUR_NAME}</p>
          <p className="mt-4 max-w-sm text-sm text-slate-500">
            Premium real estate operating platform — CRM, deals, documents, and finance in one workspace.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            <span className="text-slate-600">Contact:</span>{" "}
            <a href={mailto} className="text-[#C9A646] hover:underline">
              {contactEmail}
            </a>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/#features" className="hover:text-[#C9A646]">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#C9A646]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/demo" className="hover:text-[#C9A646]">
                  Demo
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/about" className="hover:text-[#C9A646]">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#C9A646]">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-[#C9A646]">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Legacy</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/legacy-home" className="hover:text-[#C9A646]">
                  Previous homepage
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-8 text-center text-xs text-slate-600">
        © {year} {PLATFORM_COPYRIGHT_LINE}. All rights reserved.
      </div>
    </footer>
  );
}
