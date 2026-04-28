import { Link } from "@/i18n/navigation";

export function UltraLiteNav() {
  return (
    <nav className="ultra-lite-nav" aria-label="Lite navigation">
      <Link href="/lite">Home</Link>
      <Link href="/lite/listings">Listings</Link>
      <Link href="/lite/requests">Requests</Link>
      <Link href="/lite/chat">Chat</Link>
      <Link href="/sybnb">Full app</Link>
    </nav>
  );
}
