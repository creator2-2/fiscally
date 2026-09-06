"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { Disclaimer } from "@/components/Disclaimer";
import { EstimateBreakdown } from "@/components/EstimateBreakdown";
import { Field, MoneyInput, SelectInput, TextArea, TextInput, Toggle } from "@/components/Fields";
import { computeEstimate } from "@/lib/tax-engine";
import { ACTIVITY_LABELS, CAEN_HINTS, COUNTIES, type ActivityType, type Profile } from "@/lib/types";
import { useStore } from "@/lib/store";

const STEPS = ["Profil PFA", "Venituri", "TVA & contribuții", "Recapitulare"];

export default function WizardPage() {
  const router = useRouter();
  const { profile, ready, replaceProfile, setWizardComplete } = useStore();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Profile>(profile);

  useEffect(() => {
    if (ready) setDraft(profile);
    // Hydrate once from localStorage; do not reset while the user edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const estimate = useMemo(() => computeEstimate(draft), [draft]);

  function patch(p: Partial<Profile>) {
    setDraft((prev) => ({ ...prev, ...p }));
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    replaceProfile(draft);
    setWizardComplete(true);
    router.push("/acasa");
  }

  return (
    <div className="min-h-dvh bg-paper">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 py-5">
        <BrandMark size="sm" />
        <p className="text-sm text-ink-soft">
          Pasul {step + 1} / {STEPS.length}
        </p>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16">
        <div className="mb-6 flex gap-1.5">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-sage" : "bg-line"}`}
              aria-label={label}
            />
          ))}
        </div>

        <h1 className="font-display text-4xl text-ink">{STEPS[step]}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Asistent vechi de profil PFA. Pentru Declarația unică, folosește{" "}
          <Link href="/pregateste-du" className="font-semibold text-sage-deep">
            Pregătește Declarația unică
          </Link>
          . Datele rămân pe dispozitiv.
        </p>

        <div className="mt-6 space-y-4">
          {step === 0 ? <StepProfile draft={draft} patch={patch} /> : null}
          {step === 1 ? <StepIncome draft={draft} patch={patch} /> : null}
          {step === 2 ? <StepTax draft={draft} patch={patch} /> : null}
          {step === 3 ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-line bg-white p-4">
                <p className="font-medium text-ink">{draft.fullName || "Fără nume"} · {draft.cui || "fără CUI"}</p>
                <p className="text-sm text-ink-soft">
                  {ACTIVITY_LABELS[draft.activity]} · {draft.county}
                  {draft.tvaPayer ? " · plătitor TVA" : ""}
                </p>
              </div>
              <EstimateBreakdown estimate={estimate} compact />
              <Disclaimer />
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink"
            >
              Înapoi
            </button>
          ) : null}
          <button
            type="button"
            onClick={next}
            className="flex-1 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-white hover:bg-sage-deep"
          >
            {step === STEPS.length - 1 ? "Salvează și mergi acasă" : "Continuă"}
          </button>
        </div>
      </main>
    </div>
  );
}

function StepProfile({
  draft,
  patch,
}: {
  draft: Profile;
  patch: (p: Partial<Profile>) => void;
}) {
  return (
    <>
      <Field label="Nume și prenume">
        <TextInput
          value={draft.fullName}
          onChange={(e) => patch({ fullName: e.target.value })}
          placeholder="Ana Popescu"
        />
      </Field>
      <Field label="Denumire PFA" hint="Opțional, dacă e diferită de nume.">
        <TextInput
          value={draft.tradeName}
          onChange={(e) => patch({ tradeName: e.target.value })}
          placeholder="PFA Ana Popescu"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="CUI">
          <TextInput value={draft.cui} onChange={(e) => patch({ cui: e.target.value })} placeholder="RO12345678" />
        </Field>
        <Field label="Email">
          <TextInput
            type="email"
            value={draft.email}
            onChange={(e) => patch({ email: e.target.value })}
            placeholder="ana@studio.ro"
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefon">
          <TextInput value={draft.phone} onChange={(e) => patch({ phone: e.target.value })} placeholder="07xx xxx xxx" />
        </Field>
        <Field label="Județ">
          <SelectInput value={draft.county} onChange={(e) => patch({ county: e.target.value })}>
            {COUNTIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Localitate">
          <TextInput value={draft.city} onChange={(e) => patch({ city: e.target.value })} />
        </Field>
        <Field label="Adresă">
          <TextInput value={draft.address} onChange={(e) => patch({ address: e.target.value })} />
        </Field>
      </div>
      <Field label="Tip de activitate">
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                patch({
                  activity: key,
                  caen: CAEN_HINTS[key].code,
                  activityDescription: draft.activityDescription || CAEN_HINTS[key].label,
                })
              }
              className={`rounded-2xl border px-3 py-3 text-sm font-medium ${
                draft.activity === key ? "border-sage bg-mint-soft text-sage-deep" : "border-line bg-white"
              }`}
            >
              {ACTIVITY_LABELS[key]}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Cod CAEN" hint={CAEN_HINTS[draft.activity].label}>
        <TextInput value={draft.caen} onChange={(e) => patch({ caen: e.target.value })} />
      </Field>
      <Field label="Descriere scurtă a serviciilor">
        <TextArea
          value={draft.activityDescription}
          onChange={(e) => patch({ activityDescription: e.target.value })}
          placeholder="Dezvoltare software, consultanță, design..."
        />
      </Field>
    </>
  );
}

function StepIncome({
  draft,
  patch,
}: {
  draft: Profile;
  patch: (p: Partial<Profile>) => void;
}) {
  const estimate = computeEstimate(draft);
  return (
    <>
      <Field label="An fiscal">
        <TextInput value="2026" readOnly />
      </Field>
      <Field label="Venituri brute estimate (lei)" hint="Total încasări / venituri impozabile pe an.">
        <MoneyInput value={draft.income} onValue={(income) => patch({ income })} placeholder="180000" />
      </Field>
      <Field label="Cheltuieli deductibile (lei)" hint="Chirie birou, software, subcontractori, etc.">
        <MoneyInput value={draft.expenses} onValue={(expenses) => patch({ expenses })} placeholder="24000" />
      </Field>
      <div className="rounded-3xl border border-line bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Estimare preliminară</p>
        <p className="mt-1 font-display text-3xl text-ink">
          {estimate.totalSocialAndTax.toLocaleString("ro-RO")} lei
        </p>
        <p className="text-sm text-ink-soft">CAS + CASS + impozit, orientativ. Detalii pe ecranul Estimări.</p>
      </div>
    </>
  );
}

function StepTax({
  draft,
  patch,
}: {
  draft: Profile;
  patch: (p: Partial<Profile>) => void;
}) {
  const estimate = computeEstimate(draft);
  return (
    <>
      <Toggle
        checked={draft.tvaPayer}
        onChange={(tvaPayer) => patch({ tvaPayer })}
        label="Sunt plătitor de TVA"
        hint="TVA-ul se calculează separat de impozitul pe venit."
      />
      {draft.tvaPayer ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="TVA colectată (lei)">
            <MoneyInput value={draft.tvaCollected} onValue={(tvaCollected) => patch({ tvaCollected })} />
          </Field>
          <Field label="TVA deductibilă (lei)">
            <MoneyInput value={draft.tvaDeductible} onValue={(tvaDeductible) => patch({ tvaDeductible })} />
          </Field>
        </div>
      ) : null}
      <Toggle
        checked={draft.alsoEmployee}
        onChange={(alsoEmployee) => patch({ alsoEmployee })}
        label="Sunt și salariat"
        hint="Poate elimina baza minimă de CASS pe PFA. Verifică cu un contabil."
      />
      {!estimate.casMandatory ? (
        <Toggle
          checked={draft.casOptional}
          onChange={(casOptional) => patch({ casOptional })}
          label="Vreau CAS opțional (pensie)"
          hint="Sub 12 salarii minime, CAS nu e obligatoriu."
        />
      ) : (
        <Field label="Bază CAS" hint="Peste 24 salarii minime, baza se plafonează automat la 24.">
          <SelectInput
            value={draft.casBaseChoice}
            onChange={(e) => patch({ casBaseChoice: e.target.value as Profile["casBaseChoice"] })}
          >
            <option value="12">12 salarii minime</option>
            <option value="24">24 salarii minime</option>
          </SelectInput>
        </Field>
      )}
    </>
  );
}
