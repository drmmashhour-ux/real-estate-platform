export default function FounderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}
