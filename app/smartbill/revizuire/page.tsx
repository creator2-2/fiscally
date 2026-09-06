"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Disclaimer } from "@/components/Disclaimer";
import { EstimateBreakdown } from "@/components/EstimateBreakdown";
import { Field, MoneyInput, SelectInput, TextInput, Toggle } from "@/components/Fields";
import { SourceBadge } from "@/components/smartbill/SourceBadge";
import { emptyD212, estimateFromDraft, type D212Draft, type FieldSource } from "@/lib/d212-model";
import { formatRon } from "@/lib/format";
import type { CasBaseChoice } from "@/lib/types";
import { useStore } from "@/lib/store";

export default function ReviewD212Page() {
  const { profile, d212, applyD212 } = useStore();
  const [draft, setDraft] = useState<D212Draft>(d212 ?? emptyD212(profile));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (d212) setDraft(d212);
  }, [d212]);
  const estimate = useMemo(() => estimateFromDraft(profile, draft), [profile, draft]);

  function patch(partial: Partial<D212Draft>) {
    setDraft((prev) => ({ ...prev, ...partial }));
    setSaved(false);
  }

  function setAmount(
    key: "income" | "expenses" | "tvaCollected" | "tvaDeductible",
    value: number,
  ) {
    setDraft((prev) => ({
      ...prev,
      [key]: { ...prev[key], value, source: "manual" as FieldSource, note: "Editat pe ecranul de revizuire" },
    }));
    setSaved(false);
  }

  return (
    <AppShell title="Revizuiește înainte de D212">
      <p className="mb-5 max-w-2xl text-sm text-ink-soft">
        Câmpurile importate sunt marcate. Totul e editabil. Salvarea actualizează Estimările și
        pachetul Declarația unică. Tu verifici cifrele înainte de SPV — Fiscally nu depune.
      </p>

      {draft.importSummary ? (
        <p className="mb-4 rounded-2xl bg-mint-soft px-4 py-3 text-sm text-sage-deep">
          Ultimul import: {draft.importSummary.source === "csv" ? "CSV" : "SmartBill"} ·{" "}
          {draft.importSummary.includedCount} documente · {formatRon(draft.importSummary.totalIncome)}{" "}
          în {draft.importSummary.year}
        </p>
      ) : (
        <p className="mb-4 rounded-2xl bg-paper px-4 py-3 text-sm text-ink-soft">
          Nu există încă un import. Poți edita manual sau{" "}
          <Link href="/smartbill/import" className="font-semibold text-sage-deep">
            importă facturi
          </Link>
          .
        </p>
      )}

      <section className="mb-5 grid gap-3 rounded-3xl border border-line bg-white p-5 sm:grid-cols-2">
        <Field label="Nume">
          <TextInput
            value={draft.identity.fullName}
            onChange={(e) => patch({ identity: { ...draft.identity, fullName: e.target.value } })}
          />
        </Field>
        <Field label="CUI">
          <TextInput
            value={draft.identity.cui}
            onChange={(e) => patch({ identity: { ...draft.identity, cui: e.target.value } })}
          />
        </Field>
        <Field label="CNP">
          <TextInput
            value={draft.identity.cnp}
            onChange={(e) => patch({ identity: { ...draft.identity, cnp: e.target.value } })}
          />
        </Field>
        <LabeledMoney
          label="Chirii PF (brut)"
          source={draft.pfRentalIncome.source}
          note={draft.pfRentalIncome.note}
          value={draft.pfRentalIncome.value}
          onValue={(v) =>
            setDraft((prev) => ({
              ...prev,
              pfRentalIncome: { ...prev.pfRentalIncome, value: v, source: "manual" },
            }))
          }
        />
        <LabeledMoney
          label="Alte venituri PF"
          source={draft.pfOtherIncome.source}
          note={draft.pfOtherIncome.note}
          value={draft.pfOtherIncome.value}
          onValue={(v) =>
            setDraft((prev) => ({
              ...prev,
              pfOtherIncome: { ...prev.pfOtherIncome, value: v, source: "manual" },
            }))
          }
        />
        <LabeledMoney
          label="Venituri brute (activitate independentă)"
          source={draft.income.source}
          note={draft.income.note}
          value={draft.income.value}
          onValue={(v) => setAmount("income", v)}
        />
        <LabeledMoney
          label="Cheltuieli deductibile"
          source={draft.expenses.source}
          note={draft.expenses.note}
          value={draft.expenses.value}
          onValue={(v) => setAmount("expenses", v)}
        />
        <Toggle
          checked={draft.tvaPayer}
          onChange={(tvaPayer) => patch({ tvaPayer })}
          label="Plătitor TVA"
          hint="TVA-ul nu se amestecă cu impozitul pe venit."
        />
        <Toggle
          checked={draft.alsoEmployee}
          onChange={(alsoEmployee) => patch({ alsoEmployee })}
          label="Sunt și salariat"
        />
        {draft.tvaPayer ? (
          <>
            <LabeledMoney
              label="TVA colectată"
              source={draft.tvaCollected.source}
              note={draft.tvaCollected.note}
              value={draft.tvaCollected.value}
              onValue={(v) => setAmount("tvaCollected", v)}
            />
            <LabeledMoney
              label="TVA deductibilă"
              source={draft.tvaDeductible.source}
              note={draft.tvaDeductible.note}
              value={draft.tvaDeductible.value}
              onValue={(v) => setAmount("tvaDeductible", v)}
            />
          </>
        ) : null}
        <Field label="Bază CAS">
          <SelectInput
            value={draft.casBaseChoice}
            onChange={(e) => patch({ casBaseChoice: e.target.value as CasBaseChoice })}
          >
            <option value="12">12 salarii minime</option>
            <option value="24">24 salarii minime</option>
          </SelectInput>
        </Field>
      </section>

      <EstimateBreakdown estimate={estimate} compact />

      <div className="mt-6">
        <Disclaimer />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            applyD212(draft);
            setSaved(true);
          }}
          className="rounded-full bg-sage px-4 py-2.5 text-sm font-semibold text-white"
        >
          Salvează în Fiscally
        </button>
        <Link
          href="/pregateste-du"
          className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold"
        >
          Pregătește Declarația unică
        </Link>
        <Link
          href="/documente/declaratie-unica"
          className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold"
        >
          Deschide pachetul D212
        </Link>
        <Link href="/estimari" className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold">
          Vezi Estimări
        </Link>
      </div>
      {saved ? (
        <p className="mt-3 text-sm text-sage-deep">
          Salvat. Estimările și Declarația unică folosesc acum aceste cifre.
        </p>
      ) : null}
    </AppShell>
  );
}

function LabeledMoney({
  label,
  source,
  note,
  value,
  onValue,
}: {
  label: string;
  source: FieldSource;
  note: string;
  value: number;
  onValue: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink">{label}</span>
        <SourceBadge source={source} />
      </div>
      <MoneyInput value={value} onValue={onValue} />
      <p className="mt-1 text-xs text-ink-soft">{note}</p>
    </div>
  );
}
