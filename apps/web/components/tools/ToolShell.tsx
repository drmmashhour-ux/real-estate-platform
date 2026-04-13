import { PlatformToolShellHeader } from "@/components/layout/PlatformToolShellHeader";

export function ToolShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B0B0B] text-slate-200">
      <PlatformToolShellHeader title={title} subtitle={subtitle} eyebrow="LECIPM tools" />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}

export function LegalDisclaimerBlock() {
  return (
    <div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-xs text-amber-100/90">
      <p className="font-semibold text-amber-200">Important</p>
      <p className="mt-2">
        Informational estimate only. Not legal, tax, mortgage, or accounting advice. Rates, rebates, and rules may change.
        Verify with an accountant, notary, broker, or mortgage professional.
      </p>
    </div>
  );
}
