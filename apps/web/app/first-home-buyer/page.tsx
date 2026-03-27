import type { Metadata } from "next";
import { ToolShell } from "@/components/tools/ToolShell";
import { FirstHomeBuyerClient } from "./FirstHomeBuyerClient";

export const metadata: Metadata = {
  title: "First home buyer tools",
  description: "Affordability, down payment, payments, closing costs, and welcome tax — estimates only.",
};

export default function FirstHomeBuyerPage() {
  return (
    <ToolShell
      title="First home buyer hub"
      subtitle="Explore affordability and costs — verify everything with licensed professionals."
    >
      <FirstHomeBuyerClient />
    </ToolShell>
  );
}
