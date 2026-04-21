import type { Metadata } from "next";
import Link from "next/link";
import { ClosingRoomClient } from "@/components/closing-console/closing-room-client";

export const metadata: Metadata = {
  title: "Closing room · LECIPM",
};

export default async function ClosingRoomPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; dealId: string }>;
}) {
  const { locale, country, dealId } = await params;
  const prefix = `/${locale}/${country}`;
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href={`${prefix}/dashboard/closing/${dealId}`} className="text-sm text-primary underline-offset-4 hover:underline">
        ← Workspace
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Secure closing room</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{dealId}</p>
      </div>
      <ClosingRoomClient dealId={dealId} />
    </div>
  );
}
