import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { ButtonLink } from "@/components/ui/Button";
import { Card, Kicker } from "@/components/ui/Card";
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
          Încarci dovezile (poză, PDF, CSV, Excel), calculezi orientativ CAS / CASS / impozit și ieși
          cu un dosar D212 gata de completat. Tu depui în SPV.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/pregateste-du" size="lg">
            Pregătește Declarația unică
          </ButtonLink>
          <ButtonLink href="/acasa" variant="secondary" size="lg">
            Am deja dosar
          </ButtonLink>
        </div>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            {
              t: "Pregătește",
              d: "Cine depune, anul, inbox de dovezi (orice fișier + linie manuală), calcul, revizuire.",
            },
            {
              t: "Exportă",
              d: "Pachet Declarația unică, JSON/PDF precompletat, situație fiscală. Restul e secundar.",
            },
            {
              t: "Depune",
              d: "Tu deschizi formularul ANAF și transmiți în SPV. Fiscally nu se conectează și nu pretinde că a depus.",
            },
          ].map((card) => (
            <Card key={card.t} className="bg-white/85">
              <h2 className="font-display text-2xl text-ink">{card.t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{card.d}</p>
            </Card>
          ))}
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl bg-ink px-6 py-7 text-white">
            <Kicker className="text-mint">Gratuit</Kicker>
            <h2 className="mt-2 font-display text-3xl">0 lei</h2>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>Flux Pregătește DU (PF și/sau PFA)</li>
              <li>Estimare fiscală pe ecran</li>
              <li>Import CSV / SmartBill</li>
              <li>Preview checklist Declarația unică</li>
            </ul>
          </article>
          <Card className="px-6 py-7">
            <Kicker>Fiscally</Kicker>
            <h2 className="mt-2 font-display text-3xl text-ink">{PRICE_LEI} lei / lună</h2>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              <li>Toate exporturile PDF</li>
              <li>Pachet Declarația unică + pachet contabil</li>
              <li>Contract PFA și factură / proformă</li>
              <li>Dosar e-Factura / SPV</li>
            </ul>
            <ButtonLink href="/pregateste-du" className="mt-6">
              Pregătește Declarația unică
            </ButtonLink>
          </Card>
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
