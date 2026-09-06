import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { PRICE_LEI } from "@/lib/types";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[radial-gradient(1200px_600px_at_80%_-10%,#d7eadc_0%,transparent_55%),radial-gradient(800px_400px_at_0%_10%,#eef3ea_0%,transparent_50%)]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <BrandMark />
        <Link href="/cont" className="text-sm font-medium text-ink-soft hover:text-ink">
          Cont
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 md:pt-14">
        <p className="inline-flex rounded-full bg-mint px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sage-deep">
          Persoană fizică și PFA · Declarația unică
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.05] tracking-tight text-ink md:text-7xl">
          Pregătește Declarația unică.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
          Aduni dovezile de venit, calculezi orientativ CAS / CASS / impozit și ieși cu un dosar
          D212. Tu depui în SPV. Contractele și proformele rămân secundare.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/pregateste-du"
            className="rounded-full bg-sage px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sage/25 hover:bg-sage-deep"
          >
            Pregătește Declarația unică
          </Link>
          <Link
            href="/acasa"
            className="rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-ink hover:bg-paper"
          >
            Am deja dosar
          </Link>
        </div>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            {
              t: "Pregătește",
              d: "Cine depune, anul, dovezi (CSV / SmartBill), calcul automat, revizuire D212.",
            },
            {
              t: "Exportă",
              d: "Pachet Declarația unică, situație fiscală, dosar pentru contabil. Restul e secundar.",
            },
            {
              t: "Depune",
              d: "Tu depui în SPV. Fiscally nu se conectează la ANAF și nu pretinde că o face.",
            },
          ].map((card) => (
            <article key={card.t} className="rounded-3xl border border-line bg-white/80 p-5 shadow-sm">
              <h2 className="font-display text-2xl text-ink">{card.t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{card.d}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl bg-ink px-6 py-7 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mint">Gratuit</p>
            <h2 className="mt-2 font-display text-3xl">0 lei</h2>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>Flux Pregătește DU (PF și/sau PFA)</li>
              <li>Estimare fiscală pe ecran</li>
              <li>Import CSV / SmartBill</li>
              <li>Preview checklist Declarația unică</li>
            </ul>
          </article>
          <article className="rounded-3xl border border-line bg-white px-6 py-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage">Fiscally</p>
            <h2 className="mt-2 font-display text-3xl text-ink">{PRICE_LEI} lei / lună</h2>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              <li>Toate exporturile PDF</li>
              <li>Pachet Declarația unică + pachet contabil</li>
              <li>Contract PFA și factură / proformă</li>
              <li>Dosar e-Factura / SPV</li>
            </ul>
            <Link
              href="/pregateste-du"
              className="mt-6 inline-flex rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-deep"
            >
              Pregătește Declarația unică
            </Link>
          </article>
        </section>

        <p className="mt-12 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Complementar cu SmartBill: ei facturează, tu îți pregătești obligațiile. Fiscally nu este
          contabil autorizat, nu oferă sfat juridic și nu depune declarații. Estimările 2026 sunt
          orientative.
        </p>
      </main>
    </div>
  );
}
