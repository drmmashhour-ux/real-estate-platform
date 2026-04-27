import { SybnbHubHeader } from "@/components/sybnb/SybnbHubHeader";

export default function SybnbLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SybnbHubHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">{children}</main>
    </div>
  );
}
