import { VerifyContactClient } from "./verify-contact-client";

export const metadata = {
  title: "Verify email or phone | LECIPM",
};

export default function VerifyContactPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <VerifyContactClient />
    </main>
  );
}
