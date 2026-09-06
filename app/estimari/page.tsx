"use client";

import { AppShell } from "@/components/AppShell";
import { PrepareDuButton } from "@/components/PrepareDuButton";
import { Disclaimer } from "@/components/Disclaimer";
import { EstimateBreakdown } from "@/components/EstimateBreakdown";
import { ExportBar } from "@/components/ExportBar";
import { ButtonLink } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { formatRon } from "@/lib/format";
import { TAX_CONFIG_2026 } from "@/lib/tax-config";
import { includesPf, includesPfa, ROLE_LABELS } from "@/lib/du-flow";
import { useCombinedEstimate, useEstimate, useStore } from "@/lib/store";
import Link from "next/link";

export default function EstimariPage() {
  const { wizardComplete, d212, duFlow } = useStore();
  const estimate = useEstimate();
  const combined = useCombinedEstimate();

  return (
    <AppShell
      title="Estimări"
      action={
        <div className="flex flex-wrap gap-2">
          <PrepareDuButton size="sm" />
          <ExportBar id="situatie-fiscala" label="Exportă situația PDF" />
        </div>
      }
    >
      <p className="mb-6 max-w-2xl text-ink-soft">
        Defalcarea de pe ecran este gratuită. PDF-ul situației fiscale se deblochează cu planul de
        39 lei/lună. Toate valorile sunt {TAX_CONFIG_2026.label.toLowerCase()}.
      </p>

      {d212?.importSummary ? (
        <p className="mb-4 rounded-2xl bg-mint-soft px-4 py-3 text-sm text-sage-deep">
          Veniturile folosesc importul {d212.importSummary.source === "csv" ? "CSV" : "SmartBill"} (
          {d212.importSummary.includedCount} documente, {d212.year}).{" "}
          <Link href="/smartbill/revizuire" className="font-semibold">
            Revizuiește D212 →
          </Link>
        </p>
      ) : (
        <p className="mb-4 text-sm text-ink-soft">
          Poți aduce veniturile din facturi în{" "}
          <Link href="/pregateste-du" className="font-semibold text-sage-deep">
            Pregătește Declarația unică
          </Link>
          .
        </p>
      )}

      {combined ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Card className="px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Cine depune</p>
            <p className="mt-1 font-display text-2xl tracking-tight text-ink">{ROLE_LABELS[combined.role]}</p>
          </Card>
          <Card className="px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Venituri adunate</p>
            <p className="mt-1 font-display text-2xl tracking-tight text-ink">{formatRon(combined.totalIncome)}</p>
          </Card>
          <Card tone="mint" className="px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">CAS + CASS + impozit</p>
            <p className="mt-1 font-display text-2xl tracking-tight text-ink">{formatRon(combined.totalDue)}</p>
          </Card>
        </div>
      ) : null}

      {!wizardComplete ? (
        <div className="mb-6">
          <EmptyState
            title="Estimarea e încă goală"
            text="Completează Pregătește Declarația unică ca sumele să aibă sens."
            action={<ButtonLink href="/pregateste-du">Pregătește Declarația unică</ButtonLink>}
          />
        </div>
      ) : null}

      {includesPfa(combined?.role ?? duFlow.role) || !includesPf(combined?.role ?? duFlow.role) ? (
        <div className="mb-6">
          <h2 className="mb-3 font-display text-2xl text-ink">PFA · sistem real</h2>
          <EstimateBreakdown estimate={estimate} compact />
        </div>
      ) : null}

      {combined?.pf && includesPf(combined.role) ? (
        <div className="mb-6 rounded-3xl border border-line bg-white p-5">
          <h2 className="font-display text-2xl text-ink">Persoană fizică · chirii / alte venituri</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Ipoteză 2026: chirii 20% forfetar, impozit 10%, CASS orientativ. Fără CAS pe aceste fluxuri.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between border-b border-line/70 py-1.5">
              <span>Chirii brute</span>
              <span className="font-medium tabular-nums">{formatRon(combined.pf.rentalGross)}</span>
            </li>
            <li className="flex justify-between border-b border-line/70 py-1.5">
              <span>Bază chirii (80%)</span>
              <span className="font-medium tabular-nums">{formatRon(combined.pf.rentalNet)}</span>
            </li>
            <li className="flex justify-between border-b border-line/70 py-1.5">
              <span>Alte venituri nete</span>
              <span className="font-medium tabular-nums">{formatRon(combined.pf.otherNet)}</span>
            </li>
            <li className="flex justify-between border-b border-line/70 py-1.5">
              <span>Impozit PF</span>
              <span className="font-medium tabular-nums">{formatRon(combined.pf.incomeTax)}</span>
            </li>
            <li className="flex justify-between py-1.5">
              <span>CASS PF</span>
              <span className="font-medium tabular-nums">{formatRon(combined.pf.cass)}</span>
            </li>
          </ul>
          <p className="mt-2 text-xs text-ink-soft">{combined.pf.cassNote}</p>
        </div>
      ) : null}

      <details className="mt-6 rounded-3xl border border-line bg-white p-4 text-sm text-ink-soft">
        <summary className="cursor-pointer font-medium text-ink">Ipoteze și limite</summary>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {(includesPf(combined?.role ?? null) && combined?.pf
            ? [...(includesPfa(combined.role) ? estimate.assumptions : []), ...combined.pf.assumptions]
            : estimate.assumptions
          ).map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </details>

      <div className="mt-6">
        <Disclaimer />
      </div>
    </AppShell>
  );
}
