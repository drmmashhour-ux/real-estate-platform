import Link from "next/link";
import { BROKER_PHONE_LINK, CONTACT_EMAIL, getBrokerPhoneDisplay } from "@/lib/config/contact";

/**
 * Licensed brokerage document services (Québec / OACIQ framing).
 * Prices shown plus applicable taxes — not a substitute for notary services where required by law.
 */
export function ListYourPropertyBrokerDocumentDesk() {
  const brokerTel = getBrokerPhoneDisplay();
  const mailBroker = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Broker document service — quote request")}`;

  return (
    <section
      id="broker-document-desk"
      className="scroll-mt-28"
      aria-labelledby="broker-desk-heading"
    >
      <div className="relative overflow-hidden rounded-3xl border border-premium-gold/35 bg-gradient-to-br from-premium-gold/[0.12] via-black/60 to-black/90 p-6 shadow-[0_32px_100px_rgba(0,0,0,0.45)] sm:p-10">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-premium-gold/10 blur-3xl"
          aria-hidden
        />
        <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-premium-gold/90">
          Licensed brokerage · OACIQ residential
        </p>
        <h2
          id="broker-desk-heading"
          className="mx-auto mt-4 max-w-3xl text-center font-serif text-2xl font-semibold leading-snug text-white sm:text-3xl md:text-[1.75rem]"
        >
          Close your deal with broker-prepared documents — buyers and sellers on their own still need a file that holds
          up
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-sm leading-relaxed text-slate-300 sm:text-base">
          Self-represented or FSBO does not mean improvising at the notary. Our{" "}
          <span className="text-white">licensed real estate broker</span> team can prepare and supervise the transaction
          documents under brokerage standards, using <span className="text-white">OACIQ-aligned</span> residential
          practice — so you get professional drafting without guessing which form goes where.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-center text-xs text-slate-500">
          Not legal advice. Certain acts remain with your notary or other licensed professionals as required. A written
          brokerage agreement confirms scope, fees, and representation.
        </p>

        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
          <article className="flex flex-col rounded-2xl border border-white/12 bg-black/50 p-6 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold/85">Success-based</p>
            <p className="mt-3 font-serif text-3xl font-semibold text-white">
              1% <span className="text-lg font-normal text-slate-400">of the transaction</span>
            </p>
            <p className="mt-1 text-sm font-medium text-premium-gold/95">+ applicable taxes (GST &amp; QST)</p>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-400">
              When you want the broker aligned with a successful close: compensation is tied to the deal completing —
              ideal if you expect a firm closing price and want full file coordination through signing conditions.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-500">
              <li>· Broker-supervised document package for your side of the transaction</li>
              <li>· Pricing shown <span className="text-slate-400">plus taxes</span> — invoice on agreed trigger</li>
            </ul>
          </article>

          <article className="relative flex flex-col rounded-2xl border border-premium-gold/40 bg-gradient-to-b from-premium-gold/15 to-black/70 p-6 shadow-inner shadow-premium-gold/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Fixed drafting</p>
            <p className="mt-3 font-serif text-3xl font-semibold text-white">
              $599 <span className="text-lg font-normal text-slate-400">complete package</span>
            </p>
            <p className="mt-1 text-sm font-medium text-premium-gold/95">+ applicable taxes (GST &amp; QST)</p>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-300">
              One upfront path: full drafting of the core brokerage file for a private purchase or sale — structured,
              reviewed, and ready for your notary appointment. Best when you already know your price and counterpart.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-500">
              <li>· End-to-end document bundle under broker desk standards</li>
              <li>· All advertised brokerage prices are <span className="text-slate-400">plus applicable taxes</span></li>
            </ul>
          </article>
        </div>

        <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href={BROKER_PHONE_LINK}
            className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-xl bg-premium-gold px-6 text-sm font-semibold text-black shadow-lg shadow-amber-900/30 transition hover:brightness-110 sm:w-auto"
          >
            Call {brokerTel}
          </a>
          <a
            href={mailBroker}
            className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-xl border border-white/25 px-6 text-sm font-semibold text-white transition hover:border-premium-gold/50 hover:bg-white/5 sm:w-auto"
          >
            Email a quote request
          </a>
          <Link
            href="/support"
            className="text-center text-sm font-medium text-premium-gold/90 hover:text-premium-gold hover:underline"
          >
            Help &amp; support →
          </Link>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-[11px] leading-relaxed text-slate-600">
          OACIQ: Organisme d&apos;autoréglementation du courtage immobilier du Québec. Services are offered subject to
          eligibility, conflict checks, and a signed brokerage contract. Taxes: federal GST and Québec QST apply to
          taxable brokerage services as prescribed.
        </p>
      </div>
    </section>
  );
}
