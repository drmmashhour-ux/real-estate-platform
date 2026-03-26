import Link from "next/link";
import "./globals.css";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-slate-950">
                  MI
                </span>
                <div>
                  <p className="text-sm font-semibold sm:text-base">
                    Mashhour Investments
                  </p>
                  <p className="text-xs text-slate-400">
                    Real Estate Platform
                  </p>
                </div>
              </div>
              <nav className="flex items-center gap-4 text-xs font-medium text-slate-300 sm:text-sm">
                <Link href="/" className="hover:text-emerald-300">
                  Home
                </Link>
                <Link href="/properties" className="hover:text-emerald-300">
                  Properties
                </Link>
                <Link href="/contact" className="hover:text-emerald-300">
                  Contact
                </Link>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-slate-800 bg-slate-950/90">
            <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:px-6 lg:px-8">
              <p>
                © {new Date().getFullYear()} Mashhour Investments. All rights
                reserved.
              </p>
              <div className="flex flex-wrap gap-3">
                <span>Prime properties. Transparent insights.</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
