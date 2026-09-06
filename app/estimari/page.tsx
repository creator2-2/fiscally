"use client";

import { AppShell } from "@/components/AppShell";
import { Disclaimer } from "@/components/Disclaimer";
import { EstimateBreakdown } from "@/components/EstimateBreakdown";
import { ExportBar } from "@/components/ExportBar";
import { TAX_CONFIG_2026 } from "@/lib/tax-config";
import { useEstimate, useStore } from "@/lib/store";
import Link from "next/link";

export default function EstimariPage() {
  const { wizardComplete, d212 } = useStore();
  const estimate = useEstimate();

  return (
    <AppShell
      title="Estimări"
      action={<ExportBar id="situatie-fiscala" label="Exportă situația PDF" />}
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
          Poți aduce veniturile din facturi:{" "}
          <Link href="/smartbill" className="font-semibold text-sage-deep">
            Importă din SmartBill
          </Link>
          .
        </p>
      )}

      {!wizardComplete ? (
        <div className="mb-6 rounded-3xl border border-line bg-white p-5">
          <p className="text-sm text-ink-soft">
            Completează asistentul ca estimarea să aibă sens.
          </p>
          <Link href="/wizard" className="mt-3 inline-flex text-sm font-semibold text-sage-deep">
            Deschide asistentul →
          </Link>
        </div>
      ) : null}

      <EstimateBreakdown estimate={estimate} />

      <details className="mt-6 rounded-3xl border border-line bg-white p-4 text-sm text-ink-soft">
        <summary className="cursor-pointer font-medium text-ink">Ipoteze și limite</summary>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {estimate.assumptions.map((a) => (
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
