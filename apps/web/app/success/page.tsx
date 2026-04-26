import { BookingSuccessPanel } from "./booking-success-panel";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const sp = await searchParams;
  const bookingId = typeof sp.bookingId === "string" ? sp.bookingId.trim() : undefined;

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Payment successful</h1>
      <BookingSuccessPanel bookingId={bookingId} />
    </main>
  );
}
