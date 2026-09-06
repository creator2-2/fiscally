"use client";

import { useEffect, useMemo, useState } from "react";
import { AnafDosar } from "@/components/anaf/AnafDosar";
import { AppShell } from "@/components/AppShell";
import { Disclaimer } from "@/components/Disclaimer";
import { DuProgress } from "@/components/du/DuProgress";
import { UniversalInbox } from "@/components/du/UniversalInbox";
import { EstimateBreakdown } from "@/components/EstimateBreakdown";
import { Field, MoneyInput, SelectInput, TextInput, Toggle } from "@/components/Fields";
import { SourceBadge } from "@/components/smartbill/SourceBadge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Card";
import { computeCombined, flowToPfaProfile, hydrateFreshFlow } from "@/lib/combined-tax";
import { emptyD212, flowToD212 } from "@/lib/d212-model";
import {
  DU_STEPS,
  applyImportToFlow,
  includesPf,
  includesPfa,
  ROLE_LABELS,
  type DuStep,
  type EvidenceItem,
  type FilerRole,
} from "@/lib/du-flow";
import { removeEvidenceFromFlow } from "@/lib/ocr/apply";
import { formatRon } from "@/lib/format";
import { connectSmartBill, importSmartBillInvoices } from "@/lib/smartbill/client";
import { aggregateImport } from "@/lib/smartbill/normalize";
import type { ImportedInvoice } from "@/lib/smartbill/types";
import { ACTIVITY_LABELS, type ActivityType } from "@/lib/types";
import { useStore } from "@/lib/store";

export default function PregatesteDuPage() {
  const {
    profile,
    duFlow,
    patchDuFlow,
    smartbill,
    setSmartbill,
    setImportSummary,
    setD212,
    applyD212,
    d212,
    setWizardComplete,
    updateProfile,
    setDuFlow,
    ready,
  } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [sbEmail, setSbEmail] = useState(smartbill?.email || profile.email || "");
  const [sbToken, setSbToken] = useState(smartbill?.token || "");
  const [sbCif, setSbCif] = useState(smartbill?.companyVatCode || duFlow.cui || profile.cui || "");

  useEffect(() => {
    if (!ready) return;
    const hydrated = hydrateFreshFlow(duFlow, profile);
    if (hydrated !== duFlow) patchDuFlow(hydrated);
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps -- seed once from saved profile

  const combined = useMemo(() => computeCombined(profile, duFlow), [profile, duFlow]);
  const step = duFlow.step;

  function go(next: DuStep) {
    if (next >= 4 && duFlow.role) {
      const draft = flowToD212(profile, { ...duFlow, step: next }, d212);
      setD212(draft);
    }
    patchDuFlow({ step: next });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addEvidence(item: Omit<EvidenceItem, "id" | "addedAt">) {
    const next: EvidenceItem = {
      ...item,
      id: `${item.kind}-${Date.now()}`,
      addedAt: new Date().toISOString(),
    };
    patchDuFlow({ evidence: [...duFlow.evidence, next] });
  }

  async function testSmartBill() {
    setBusy("sb");
    setMessage(null);
    try {
      const result = await connectSmartBill({
        email: sbEmail,
        token: sbToken,
        companyVatCode: sbCif,
        lastVerifiedAt: null,
      });
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) {
        await setSmartbill({
          email: sbEmail,
          token: sbToken,
          companyVatCode: sbCif,
          lastVerifiedAt: new Date().toISOString(),
        });
        if (!duFlow.cui) patchDuFlow({ cui: sbCif });
      }
    } catch {
      setMessage({ ok: false, text: "Nu am putut ajunge la SmartBill." });
    } finally {
      setBusy(null);
    }
  }

  async function importSmartBillYear() {
    if (!smartbill) {
      setMessage({ ok: false, text: "Testează mai întâi conexiunea SmartBill." });
      return;
    }
    setBusy("sb-import");
    try {
      const result = await importSmartBillInvoices(smartbill, duFlow.year);
      if (result.ok && result.data?.invoices?.length) {
        const invoices = result.data.invoices as ImportedInvoice[];
        const summary = aggregateImport(invoices, duFlow.year, "smartbill", "Import API");
        setImportSummary(summary);
        patchDuFlow(
          applyImportToFlow(duFlow, {
            kind: "smartbill",
            label: `SmartBill ${duFlow.year}`,
            year: duFlow.year,
            invoiceCount: summary.includedCount,
            total: summary.totalIncome,
          }),
        );
        setMessage({ ok: true, text: result.message });
        return;
      }
      setMessage({ ok: false, text: result.message });
    } catch {
      setMessage({ ok: false, text: "Importul API a eșuat. Folosește CSV." });
    } finally {
      setBusy(null);
    }
  }

  function finishReview() {
    const draft = flowToD212(profile, duFlow, d212 ?? emptyD212(profile, duFlow.year));
    applyD212(draft);
    setWizardComplete(true);
    go(6);
  }

  const title = DU_STEPS.find((s) => s.id === step)?.title ?? "Pregătește DU";

  return (
    <AppShell
      title="Pregătește Declarația unică"
      action={
        <span className="text-xs font-medium text-ink-soft">
          Pasul {step} / 6 · {title}
        </span>
      }
    >
      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Aduni dovezile, calculezi orientativ și pregătești dosarul D212. Tu deschizi formularul ANAF
        și depui în SPV. Fiscally nu se autentifică și nu pretinde că a depus.
      </p>
      <DuProgress step={step} onJump={(s) => go(s)} />

      {step === 1 ? (
        <section className="space-y-4">
          <Field label="Numele tău">
            <TextInput
              value={duFlow.fullName}
              onChange={(e) => patchDuFlow({ fullName: e.target.value })}
              placeholder="Ana Popescu"
            />
          </Field>
          <p className="text-sm font-medium text-ink">Cine depune Declarația unică?</p>
          <div className="grid gap-3 md:grid-cols-3">
            {(Object.keys(ROLE_LABELS) as FilerRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  patchDuFlow({ role });
                  updateProfile({ filerRole: role });
                }}
                className={`rounded-3xl border p-4 text-left ${
                  duFlow.role === role ? "border-sage bg-mint-soft" : "border-line bg-white"
                }`}
              >
                <p className="font-display text-xl text-ink">{ROLE_LABELS[role]}</p>
                <p className="mt-1 text-xs text-ink-soft">
                  {role === "pf"
                    ? "Chirii sau alte venituri, fără PFA."
                    : role === "pfa"
                      ? "Activitate independentă, sistem real."
                      : "Același CNP, plus CUI de PFA."}
                </p>
              </button>
            ))}
          </div>
          {includesPfa(duFlow.role) ? (
            <Field label="Tip PFA">
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => patchDuFlow({ pfaActivity: key })}
                    className={`rounded-2xl border px-3 py-2 text-sm font-medium ${
                      duFlow.pfaActivity === key ? "border-sage bg-mint-soft" : "border-line bg-white"
                    }`}
                  >
                    {ACTIVITY_LABELS[key]}
                  </button>
                ))}
              </div>
            </Field>
          ) : null}
          <Toggle
            checked={duFlow.alsoEmployee}
            onChange={(alsoEmployee) => patchDuFlow({ alsoEmployee })}
            label="Sunt și salariat"
            hint="Poate schimba baza minimă de CASS. Verifică cu un contabil."
          />
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4">
          <Field label="Anul veniturilor">
            <SelectInput
              value={String(duFlow.year)}
              onChange={(e) => patchDuFlow({ year: Number(e.target.value) })}
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y} — declarat de regulă până la 25 mai {y + 1}
                </option>
              ))}
            </SelectInput>
          </Field>
          {includesPfa(duFlow.role) ? (
            <Field label="CUI PFA">
              <TextInput
                value={duFlow.cui}
                onChange={(e) => patchDuFlow({ cui: e.target.value })}
                placeholder="RO12345678"
              />
            </Field>
          ) : null}
          {includesPf(duFlow.role) ? (
            <Field label="CNP" hint="Rămâne pe dispozitiv. Folosit doar în dosarul tău.">
              <TextInput
                value={duFlow.cnp}
                onChange={(e) => patchDuFlow({ cnp: e.target.value })}
                placeholder="1xxxxxxxxxxxxx"
              />
            </Field>
          ) : null}
          <Field label="Email">
            <TextInput
              type="email"
              value={duFlow.email}
              onChange={(e) => patchDuFlow({ email: e.target.value })}
            />
          </Field>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4">
          <p className="text-sm text-ink-soft">
            Inbox de dovezi pentru {duFlow.year}. Încarcă orice dovadă (poză, PDF, CSV, Excel, JSON,
            text) sau adaugă o linie manual. Confirmă înainte să intre în calcul. SmartBill rămâne o
            cale separată. Banca e în curând. Nu depunem la ANAF.
          </p>

          <UniversalInbox
            flow={duFlow}
            role={duFlow.role}
            busy={busy !== null}
            onBusy={setBusy}
            onApply={setDuFlow}
            onMessage={setMessage}
          />

          <article className="rounded-3xl border border-line bg-white p-4">
            <h3 className="font-display text-xl">Conectează SmartBill</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Opțional, dacă vrei facturile din Cloud. Tokenul rămâne pe dispozitiv.
            </p>
            <div className="mt-3 space-y-2">
              <TextInput
                placeholder="Email Cloud"
                value={sbEmail}
                onChange={(e) => setSbEmail(e.target.value)}
              />
              <TextInput
                type="password"
                placeholder="Token API"
                value={sbToken}
                onChange={(e) => setSbToken(e.target.value)}
              />
              <TextInput
                placeholder="CIF"
                value={sbCif}
                onChange={(e) => setSbCif(e.target.value)}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button disabled={busy !== null} onClick={() => void testSmartBill()}>
                Testează
              </Button>
              <Button
                variant="secondary"
                disabled={busy !== null || !smartbill}
                onClick={() => void importSmartBillYear()}
              >
                Importă {duFlow.year}
              </Button>
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              Tokenul se trimite doar prin BFF, criptat local. API V1 poate să nu listeze facturile.
            </p>
          </article>

          {includesPf(duFlow.role) ? (
            <article className="grid gap-3 rounded-3xl border border-line bg-white p-4 sm:grid-cols-2">
              <h3 className="font-display text-xl sm:col-span-2">Venituri persoană fizică</h3>
              <Field label="Chirii (brut, lei)">
                <MoneyInput
                  value={duFlow.pfRentalIncome}
                  onValue={(pfRentalIncome) => patchDuFlow({ pfRentalIncome })}
                />
              </Field>
              <Field label="Alte venituri (brut)">
                <MoneyInput
                  value={duFlow.pfOtherIncome}
                  onValue={(pfOtherIncome) => patchDuFlow({ pfOtherIncome })}
                />
              </Field>
              <Field label="Cheltuieli pe alte venituri">
                <MoneyInput
                  value={duFlow.pfOtherExpenses}
                  onValue={(pfOtherExpenses) => patchDuFlow({ pfOtherExpenses })}
                />
              </Field>
              <button
                type="button"
                onClick={() => {
                  addEvidence({
                    kind: "manual",
                    label: "Venituri PF introduse manual",
                    year: duFlow.year,
                    total: duFlow.pfRentalIncome + duFlow.pfOtherIncome,
                  });
                  setMessage({ ok: true, text: "Am notat veniturile PF în inbox." });
                }}
                className="self-end rounded-full border border-line px-4 py-2 text-sm font-semibold"
              >
                Adaugă în inbox
              </button>
            </article>
          ) : null}

          {includesPfa(duFlow.role) ? (
            <article className="grid gap-3 rounded-3xl border border-line bg-white p-4 sm:grid-cols-2">
              <h3 className="font-display text-xl sm:col-span-2">Ajustări PFA</h3>
              <Field label="Venituri PFA (lei)">
                <MoneyInput value={duFlow.pfaIncome} onValue={(pfaIncome) => patchDuFlow({ pfaIncome })} />
              </Field>
              <Field label="Cheltuieli deductibile">
                <MoneyInput
                  value={duFlow.pfaExpenses}
                  onValue={(pfaExpenses) => patchDuFlow({ pfaExpenses })}
                />
              </Field>
            </article>
          ) : null}

          <SoonCard title="Conexiune bancă" text="Extras automat de încasări — în curând." />

          {duFlow.evidence.length ? (
            <ul className="space-y-2">
              {duFlow.evidence.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl bg-paper px-3 py-2 text-sm"
                >
                  <span>
                    <strong>{item.label}</strong>
                    {item.total != null
                      ? ` · ${formatRon(item.total, Boolean(item.classification))}`
                      : ""}
                    <span className="block text-xs text-ink-soft">{item.note || item.kind}</span>
                  </span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-ink-soft"
                    onClick={() => setDuFlow(removeEvidenceFromFlow(duFlow, item.id))}
                  >
                    Șterge
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nicio dovadă confirmată"
              text="Încarcă fișiere sau adaugă o linie, apoi confirmă. Banca rămâne în curând."
            />
          )}
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-4">
          {!duFlow.role || !combined ? (
            <p className="text-sm text-ink-soft">Alege mai întâi cine depune.</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Venituri adunate" value={formatRon(combined.totalIncome)} />
                <Stat label="CAS + CASS + impozit" value={formatRon(combined.totalDue)} />
                <Stat label="Dovezi" value={String(duFlow.evidence.length)} />
              </div>
              {combined.pfa ? (
                <div className="rounded-3xl border border-line bg-white p-4">
                  <h3 className="font-display text-2xl">PFA · sistem real</h3>
                  <EstimateBreakdown estimate={combined.pfa} compact />
                </div>
              ) : null}
              {combined.pf ? (
                <div className="rounded-3xl border border-line bg-white p-4">
                  <h3 className="font-display text-2xl">Persoană fizică</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    <Li label="Chirii brute" value={formatRon(combined.pf.rentalGross)} />
                    <Li label="Bază chirii (80%)" value={formatRon(combined.pf.rentalNet)} />
                    <Li label="Alte venituri nete" value={formatRon(combined.pf.otherNet)} />
                    <Li label="Impozit PF" value={formatRon(combined.pf.incomeTax)} />
                    <Li label="CASS PF" value={formatRon(combined.pf.cass)} />
                  </ul>
                  <p className="mt-2 text-xs text-ink-soft">{combined.pf.cassNote}</p>
                </div>
              ) : null}
              <Disclaimer />
            </>
          )}
        </section>
      ) : null}

      {step === 5 ? (
        <section className="space-y-4">
          <p className="text-sm text-ink-soft">
            Totul e editabil. Salvarea actualizează Estimările și pachetul Declarația unică. Nu
            depunem la ANAF.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nume">
              <TextInput
                value={duFlow.fullName}
                onChange={(e) => patchDuFlow({ fullName: e.target.value })}
              />
            </Field>
            {includesPfa(duFlow.role) ? (
              <Field label="CUI">
                <TextInput value={duFlow.cui} onChange={(e) => patchDuFlow({ cui: e.target.value })} />
              </Field>
            ) : null}
            {includesPf(duFlow.role) ? (
              <Field label="CNP">
                <TextInput value={duFlow.cnp} onChange={(e) => patchDuFlow({ cnp: e.target.value })} />
              </Field>
            ) : null}
            <Field label="Email">
              <TextInput
                type="email"
                value={duFlow.email}
                onChange={(e) => patchDuFlow({ email: e.target.value })}
              />
            </Field>
          </div>
          {includesPfa(duFlow.role) ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Labeled
                label="Venituri PFA"
                source={duFlow.evidence.some((e) => e.kind === "csv" || e.kind === "smartbill") ? "imported" : "manual"}
              >
                <MoneyInput value={duFlow.pfaIncome} onValue={(pfaIncome) => patchDuFlow({ pfaIncome })} />
              </Labeled>
              <Labeled label="Cheltuieli PFA" source="manual">
                <MoneyInput
                  value={duFlow.pfaExpenses}
                  onValue={(pfaExpenses) => patchDuFlow({ pfaExpenses })}
                />
              </Labeled>
              <Toggle
                checked={duFlow.casOptional}
                onChange={(casOptional) => patchDuFlow({ casOptional })}
                label="CAS opțional (sub prag)"
                hint="Doar dacă vrei să plătești CAS deși nu ești obligat."
              />
              <Field label="Bază CAS">
                <SelectInput
                  value={duFlow.casBaseChoice}
                  onChange={(e) =>
                    patchDuFlow({ casBaseChoice: e.target.value as "12" | "24" })
                  }
                >
                  <option value="12">12 salarii minime</option>
                  <option value="24">24 salarii minime</option>
                </SelectInput>
              </Field>
            </div>
          ) : null}
          {includesPf(duFlow.role) ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Labeled label="Chirii PF" source="manual">
                <MoneyInput
                  value={duFlow.pfRentalIncome}
                  onValue={(pfRentalIncome) => patchDuFlow({ pfRentalIncome })}
                />
              </Labeled>
              <Labeled label="Alte venituri PF" source="manual">
                <MoneyInput
                  value={duFlow.pfOtherIncome}
                  onValue={(pfOtherIncome) => patchDuFlow({ pfOtherIncome })}
                />
              </Labeled>
              <Labeled label="Cheltuieli pe alte venituri PF" source="manual">
                <MoneyInput
                  value={duFlow.pfOtherExpenses}
                  onValue={(pfOtherExpenses) => patchDuFlow({ pfOtherExpenses })}
                />
              </Labeled>
            </div>
          ) : null}
          {includesPfa(duFlow.role) && combined?.pfa ? (
            <EstimateBreakdown estimate={combined.pfa} compact />
          ) : null}
          {combined?.pf ? (
            <p className="text-sm text-ink-soft">
              PF orientativ: impozit {formatRon(combined.pf.incomeTax)} · CASS{" "}
              {formatRon(combined.pf.cass)}. {combined.pf.cassNote}
            </p>
          ) : null}
          <ButtonLink href="/smartbill/revizuire" variant="ghost" size="sm">
            Revizuire detaliată (Faza 2) →
          </ButtonLink>
          <Disclaimer />
        </section>
      ) : null}

      {step === 6 ? (
        <section className="space-y-4">
          <AnafDosar profile={profile} flow={duFlow} d212={d212} combined={combined} />
          <Disclaimer />
        </section>
      ) : null}

      {message ? (
        <p
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            message.ok ? "bg-mint-soft text-sage-deep" : "bg-overdue/10 text-overdue"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="mt-8 flex gap-3">
        {step > 1 ? (
          <Button variant="secondary" size="lg" onClick={() => go((step - 1) as DuStep)}>
            Înapoi
          </Button>
        ) : null}
        {step < 5 ? (
          <Button
            size="lg"
            className="flex-1"
            disabled={step === 1 && !duFlow.role}
            onClick={() => go((step + 1) as DuStep)}
          >
            Continuă
          </Button>
        ) : null}
        {step === 5 ? (
          <Button size="lg" className="flex-1" onClick={finishReview}>
            Salvează și deschide dosarul
          </Button>
        ) : null}
      </div>
      {step === 4 && includesPfa(duFlow.role) ? (
        <p className="mt-3 text-xs text-ink-soft">
          Profil PFA folosit la calcul: {flowToPfaProfile(profile, duFlow).cui || "fără CUI"}.
        </p>
      ) : null}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-white px-4 py-3.5 shadow-[0_1px_0_rgba(27,42,34,0.03)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-2xl tracking-tight text-ink">{value}</p>
    </div>
  );
}

function Li({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between border-b border-line/70 py-1.5">
      <span>{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </li>
  );
}

function Labeled({
  label,
  source,
  children,
}: {
  label: string;
  source: "imported" | "manual";
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <SourceBadge source={source} />
      </div>
      {children}
    </div>
  );
}

function SoonCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-3xl border border-dashed border-line bg-paper/60 p-4 opacity-80">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">În curând</p>
      <h3 className="mt-1 font-display text-xl text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{text}</p>
      <button
        type="button"
        disabled
        className="mt-3 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft"
      >
        Indisponibil
      </button>
    </article>
  );
}
