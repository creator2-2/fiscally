"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Field, SelectInput } from "@/components/Fields";
import { mapImportToD212 } from "@/lib/d212-model";
import { parseInvoiceCsv, CSV_COLUMNS_HELP } from "@/lib/smartbill/csv";
import { importSmartBillInvoices } from "@/lib/smartbill/client";
import { aggregateImport } from "@/lib/smartbill/normalize";
import type { ImportedInvoice, ImportSummary } from "@/lib/smartbill/types";
import { formatRon } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function ImportPage() {
  const router = useRouter();
  const { profile, smartbill, d212, setImportSummary, setD212 } = useStore();
  const [year, setYear] = useState(profile.fiscalYear || 2026);
  const [busy, setBusy] = useState<"api" | "csv" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  function applySummary(next: ImportSummary) {
    setSummary(next);
    setImportSummary(next);
    setD212(mapImportToD212(profile, next, d212));
  }

  async function importFromApi() {
    if (!smartbill) {
      setError("Mai întâi conectează SmartBill sau folosește CSV.");
      return;
    }
    setBusy("api");
    setError(null);
    setInfo(null);
    try {
      const result = await importSmartBillInvoices(smartbill, year);
      if (result.ok && result.data?.invoices?.length) {
        const invoices = result.data.invoices as ImportedInvoice[];
        applySummary(
          aggregateImport(invoices, year, "smartbill", "Import din API SmartBill (BFF, fără persistare server)."),
        );
        setInfo(result.message);
        return;
      }
      setError(result.message);
    } catch {
      setError("Nu am putut apela SmartBill. Folosește CSV-ul de rezervă.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCsv(file: File | null) {
    if (!file) return;
    setBusy("csv");
    setError(null);
    try {
      const text = await file.text();
      const invoices = parseInvoiceCsv(text);
      applySummary(
        aggregateImport(
          invoices,
          year,
          "csv",
          "Import din CSV. Proformele și documentele anulate nu intră în venit.",
        ),
      );
      setInfo(`Am citit ${invoices.length} rânduri. Filtrate pe ${year}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "CSV invalid.");
    } finally {
      setBusy(null);
    }
  }

  async function loadExample() {
    setBusy("csv");
    setError(null);
    try {
      const res = await fetch("/examples/smartbill-facturi-2026.csv");
      const text = await res.text();
      const invoices = parseInvoiceCsv(text);
      applySummary(
        aggregateImport(invoices, year, "csv", "Exemplu de test Fiscally (nu sunt facturi reale)."),
      );
      setInfo("Am încărcat exemplul de test pentru 2026.");
    } catch {
      setError("Nu am putut încărca exemplul.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell title="Importă facturi">
      <p className="mb-5 max-w-2xl text-sm text-ink-soft">
        Alege anul fiscal. Dacă API-ul SmartBill nu poate lista facturile (limitare V1), încarcă un
        CSV exportat din Cloud. Apoi revizuiești maparea D212.
      </p>

      <div className="mb-4 max-w-xs">
        <Field label="An fiscal">
          <SelectInput value={String(year)} onChange={(e) => setYear(Number(e.target.value))}>
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-line bg-white p-5">
          <h2 className="font-display text-2xl text-ink">Din SmartBill</h2>
          <p className="mt-2 text-sm text-ink-soft">
            {smartbill
              ? `Cont salvat: ${smartbill.email} · ${smartbill.companyVatCode}`
              : "Nicio conexiune salvată."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy !== null || !smartbill}
              onClick={() => void importFromApi()}
              className="rounded-full bg-sage px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy === "api" ? "Se importă…" : `Importă ${year}`}
            </button>
            <Link href="/smartbill" className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold">
              Conexiune
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-white p-5">
          <h2 className="font-display text-2xl text-ink">CSV de rezervă</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Exportă din SmartBill Cloud (rapoarte / facturi emise) și aliniază coloanele de mai jos.
          </p>
          <label className="mt-4 inline-flex cursor-pointer rounded-full bg-sage px-4 py-2.5 text-sm font-semibold text-white">
            Încarcă CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => void handleCsv(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void loadExample()}
            className="ml-2 mt-4 rounded-full border border-line px-4 py-2.5 text-sm font-semibold"
          >
            Folosește exemplul de test
          </button>
        </section>
      </div>

      <details className="mt-4 rounded-3xl border border-line bg-white p-4 text-sm">
        <summary className="cursor-pointer font-medium text-ink">Coloane CSV</summary>
        <ul className="mt-3 space-y-1 text-ink-soft">
          {CSV_COLUMNS_HELP.map((col) => (
            <li key={col.key}>
              <code className="text-ink">{col.key}</code>
              {col.required ? " · obligatoriu" : ""} — {col.hint}
            </li>
          ))}
        </ul>
      </details>

      {error ? <p className="mt-4 rounded-2xl bg-overdue/10 px-4 py-3 text-sm text-overdue">{error}</p> : null}
      {info ? <p className="mt-4 rounded-2xl bg-mint-soft px-4 py-3 text-sm text-sage-deep">{info}</p> : null}

      {summary ? (
        <section className="mt-6 rounded-3xl border border-line bg-white p-5">
          <h2 className="font-display text-2xl text-ink">Sumar {summary.year}</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <Stat label="Documente în an" value={String(summary.invoiceCount)} />
            <Stat label="Care contează la venit" value={String(summary.includedCount)} />
            <Stat label="Total venit" value={formatRon(summary.totalIncome)} />
          </dl>
          {summary.skippedCount ? (
            <p className="mt-2 text-xs text-ink-soft">
              {summary.skippedCount} documente ignorate (proformă, draft sau anulate).
            </p>
          ) : null}
          <ul className="mt-4 divide-y divide-line text-sm">
            {summary.months.map((m) => (
              <li key={m.month} className="flex justify-between py-2">
                <span>
                  {m.label} · {m.count} doc.
                </span>
                <span className="tabular-nums font-medium">{formatRon(m.total)}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => router.push("/smartbill/revizuire")}
            className="mt-5 rounded-full bg-sage px-4 py-2.5 text-sm font-semibold text-white"
          >
            Revizuiește înainte de D212
          </button>
        </section>
      ) : (
        <p className="mt-6 text-sm text-ink-soft">Niciun import încă. Încarcă un CSV sau testează exemplul.</p>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="font-display text-2xl text-ink">{value}</dd>
    </div>
  );
}
