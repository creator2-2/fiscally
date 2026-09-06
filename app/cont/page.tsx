"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PRICE_LEI } from "@/lib/types";
import { formatDateRo } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useUpgrade } from "@/components/UpgradeModal";

export default function ContPage() {
  const { profile, subscribed, subscription, downgrade, reset, wizardComplete } = useStore();
  const { openUpgrade } = useUpgrade();

  return (
    <AppShell title="Cont">
      <section className="rounded-3xl border border-line bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage">Plan</p>
        <h2 className="mt-1 font-display text-3xl text-ink">
          {subscribed ? `Fiscally · ${PRICE_LEI} lei/lună` : "Gratuit"}
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          {subscribed
            ? `Activare demo din ${subscription.upgradedAt ? formatDateRo(subscription.upgradedAt) : "astăzi"}. Fără plată reală.`
            : "Poți vedea estimările, termenele și un checklist. Exporturile sunt pe paywall."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {subscribed ? (
            <button
              type="button"
              onClick={downgrade}
              className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink"
            >
              Revino la free (demo)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openUpgrade()}
              className="rounded-full bg-sage px-4 py-2.5 text-sm font-semibold text-white"
            >
              Treci la {PRICE_LEI} lei/lună
            </button>
          )}
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-line bg-white p-5">
        <h2 className="font-display text-2xl text-ink">Profil salvat</h2>
        <p className="mt-2 text-sm text-ink-soft">
          {wizardComplete
            ? `${profile.fullName || "Fără nume"} · ${profile.cui || "fără CUI"} · ${profile.county}`
            : "Asistentul nu este finalizat."}
        </p>
        <Link href="/wizard" className="mt-3 inline-flex text-sm font-semibold text-sage-deep">
          {wizardComplete ? "Editează în asistent →" : "Completează asistentul →"}
        </Link>
      </section>

      <section className="mt-4 rounded-3xl border border-line bg-white p-5">
        <h2 className="font-display text-2xl text-ink">SmartBill</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Importă facturile ca venituri în Declarația unică. Tokenul stă criptat doar pe acest
          dispozitiv.
        </p>
        <Link href="/smartbill" className="mt-3 inline-flex text-sm font-semibold text-sage-deep">
          Importă din SmartBill →
        </Link>
      </section>

      <section className="mt-4 rounded-3xl border border-line bg-white p-5">
        <h2 className="font-display text-2xl text-ink">Date locale</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Profilul și flag-ul de abonament stau în localStorage. Nimic nu pleacă către ANAF sau un
          procesator de plăți.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-3 rounded-full border border-overdue/30 px-4 py-2 text-sm font-semibold text-overdue"
        >
          Șterge datele de pe acest dispozitiv
        </button>
      </section>
    </AppShell>
  );
}
