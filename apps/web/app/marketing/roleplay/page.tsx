import { Metadata } from "next";
import { RoleplaySimulatorClient } from "./RoleplaySimulatorClient";

export const metadata: Metadata = {
  title: "Broker Roleplay Simulator | LECIPM",
  description: "Train for realistic Québec broker conversations.",
};

export default function RoleplayPage() {
  return (
    <div className="min-h-screen bg-black">
      <RoleplaySimulatorClient />
    </div>
  );
}
