"use client";

import { AppShell } from "@/components/AppShell";
import { PrepareDuButton } from "@/components/PrepareDuButton";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, Kicker } from "@/components/ui/Card";
import { PRICE_LEI } from "@/lib/types";
import { formatDateRo } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useUpgrade } from "@/components/UpgradeModal";

export default function ContPage() {
  const { profile, subscribed, subscription, downgrade, reset, wizardComplete } = useStore();
  const { openUpgrade } = useUpgrade();

  return (
    <AppShell title="Cont" action={<PrepareDuButton size="sm" />}>
      <Card>
        <Kicker>Plan</Kicker>
        <h2 className="mt-1 font-display text-3xl tracking-tight text-ink">
          {subscribed ? `Fiscally · ${PRICE_LEI} lei/lună` : "Gratuit"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {subscribed
            ? `Activare demo din ${subscription.upgradedAt ? formatDateRo(subscription.upgradedAt) : "astăzi"}. Fără plată reală.`
            : "Poți vedea estimările, termenele și un checklist. Exporturile sunt pe paywall."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {subscribed ? (
            <Button variant="secondary" onClick={downgrade}>
              Revino la free (demo)
            </Button>
          ) : (
            <Button onClick={() => openUpgrade()}>Treci la {PRICE_LEI} lei/lună</Button>
          )}
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-2xl text-ink">Profil salvat</h2>
        <p className="mt-2 text-sm text-ink-soft">
          {wizardComplete
            ? `${profile.fullName || "Fără nume"} · ${profile.cui || "fără CUI"} · ${profile.county}`
            : "Asistentul nu este finalizat."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ButtonLink href="/pregateste-du" variant="ghost" size="sm">
            Pregătește Declarația unică →
          </ButtonLink>
          <ButtonLink href="/wizard" variant="ghost" size="sm">
            {wizardComplete ? "Editează profilul vechi →" : "Asistent profil PFA →"}
          </ButtonLink>
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-2xl text-ink">SmartBill</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Importă facturile ca venituri în Declarația unică. Tokenul stă criptat doar pe acest
          dispozitiv.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ButtonLink href="/pregateste-du" variant="ghost" size="sm">
            Pregătește Declarația unică →
          </ButtonLink>
          <ButtonLink href="/smartbill" variant="ghost" size="sm">
            Doar SmartBill →
          </ButtonLink>
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-2xl text-ink">Date locale</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Profilul, dovezile și flag-ul de abonament stau în localStorage. Nimic nu pleacă către ANAF
          sau un procesator de plăți.
        </p>
        <Button variant="danger" className="mt-3" onClick={reset}>
          Șterge datele de pe acest dispozitiv
        </Button>
      </Card>
    </AppShell>
  );
}
