"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Disclaimer } from "@/components/Disclaimer";
import { PrepareDuButton } from "@/components/PrepareDuButton";
import { Card, Kicker } from "@/components/ui/Card";
import { buildDeadlines, daysUntilLabel, nextActionableDeadline } from "@/lib/deadlines";
import { formatRon } from "@/lib/format";
import { useCombinedEstimate, useStore } from "@/lib/store";

export default function HomePage() {
  const { profile, wizardComplete, subscribed } = useStore();
  const combined = useCombinedEstimate();
  const deadlines = buildDeadlines(profile);
  const next = nextActionableDeadline(deadlines);

  return (
    <AppShell title="Ce ai de făcut" action={<PrepareDuButton size="sm" />}>
      <Card tone="mint" className="mb-6">
        <Kicker>Job principal</Kicker>
        <h2 className="mt-1 font-display text-3xl tracking-tight text-ink">Pregătește Declarația unică</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Persoană fizică, PFA sau ambele. Aduni dovezile, calculezi, revizuiești, deschizi dosarul.
          Tu depui în SPV — Fiscally nu o face.
        </p>
        <PrepareDuButton className="mt-4" />
      </Card>

      {!wizardComplete ? (
        <p className="mb-6 text-sm text-ink-soft">
          Dacă vrei doar profilul vechi de PFA, rămâne{" "}
          <Link href="/wizard" className="font-semibold text-sage-deep">
            asistentul
          </Link>
          .
        </p>
      ) : (
        <p className="mb-6 text-ink-soft">
          Bună{profile.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""}. Iată următorul
          lucru util — fără panică.
        </p>
      )}

      {next ? (
        <section
          className={`mb-6 rounded-3xl border p-5 ${
            next.status === "overdue" ? "border-overdue/30 bg-overdue/5" : "border-line bg-white"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage">Următorul termen</p>
          <h2 className="mt-1 font-display text-3xl text-ink">{next.title}</h2>
          <p className={`mt-1 text-sm font-medium ${next.status === "overdue" ? "text-overdue" : "text-ink-soft"}`}>
            {daysUntilLabel(next.date)} · {new Date(next.date).toLocaleDateString("ro-RO")}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{next.description}</p>
          {next.href ? (
            <Link href={next.href} className="mt-4 inline-flex text-sm font-semibold text-sage-deep">
              Pregătește documentul →
            </Link>
          ) : null}
        </section>
      ) : null}

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <Mini
          label="Estimare anuală"
          value={formatRon(combined?.totalDue ?? 0)}
          href="/estimari"
          cta="Vezi defalcarea"
        />
        <Mini label="Documente" value="6 pachete" href="/documente" cta="Deschide hub-ul" />
        <Mini
          label="Plan"
          value={subscribed ? "Fiscally · 39 lei" : "Gratuit"}
          href="/cont"
          cta={subscribed ? "Gestionează" : "Upgrade"}
        />
      </section>

      <Card>
        <h2 className="font-display text-2xl text-ink">Acțiuni rapide</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <Action href="/pregateste-du" label="Pregătește Declarația unică" />
          <Action href="/documente/declaratie-unica" label="Deschide pachetul D212" />
          <Action href="/estimari" label="Vezi estimările" />
          <Action href="/documente" label="Documente secundare" />
          <Action href="/wizard" label="Asistentul vechi de profil" />
        </ul>
      </Card>

      <div className="mt-6">
        <Disclaimer />
      </div>
    </AppShell>
  );
}

function Mini({
  label,
  value,
  href,
  cta,
}: {
  label: string;
  value: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-line bg-white p-4 shadow-[0_1px_0_rgba(27,42,34,0.03)] transition hover:border-sage/40 hover:bg-mint-soft/40"
    >
      <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
      <p className="mt-2 text-sm font-semibold text-sage-deep">{cta} →</p>
    </Link>
  );
}

function Action({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between rounded-2xl bg-paper px-3 py-3 hover:bg-mint-soft">
        {label}
        <span aria-hidden>→</span>
      </Link>
    </li>
  );
}
