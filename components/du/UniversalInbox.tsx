"use client";

import { useMemo, useState } from "react";
import { Field, MoneyInput, SelectInput, TextInput } from "@/components/Fields";
import { applyCandidatesToFlow, suggestedIncomeClassification } from "@/lib/ocr/apply";
import { applyExcelMap } from "@/lib/inbox/excel";
import { ingestFiles, type IngestProgress } from "@/lib/inbox/ingest";
import { rowsToCandidates } from "@/lib/inbox/tabular";
import {
  ACCEPT_ATTR,
  CLASS_LABELS,
  type ColumnMap,
  type EvidenceClass,
  type IngestCandidate,
} from "@/lib/inbox/types";
import type { DuFlowState, FilerRole } from "@/lib/du-flow";
import { formatRon } from "@/lib/format";

const EXAMPLES = [
  { href: "/examples/smartbill-facturi-2026.csv", name: "smartbill-facturi-2026.csv" },
  { href: "/examples/chitanta-demo.png", name: "chitanta-demo.png" },
  { href: "/examples/dovezi-2026.xlsx", name: "dovezi-2026.xlsx" },
  { href: "/examples/factura-demo.pdf", name: "factura-demo.pdf" },
];

export function UniversalInbox({
  flow,
  role,
  busy,
  onBusy,
  onApply,
  onMessage,
}: {
  flow: DuFlowState;
  role: FilerRole | null;
  busy: boolean;
  onBusy: (key: string | null) => void;
  onApply: (next: DuFlowState) => void;
  onMessage: (msg: { ok: boolean; text: string } | null) => void;
}) {
  const [queue, setQueue] = useState<IngestCandidate[]>([]);
  const [progress, setProgress] = useState<IngestProgress | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [manual, setManual] = useState({
    amount: 0,
    date: "",
    description: "",
    classification: suggestedIncomeClassification(role) as EvidenceClass,
  });

  const valid = useMemo(
    () => queue.filter((c) => c.classification !== "ignore" && c.amount > 0 && !c.needsMapping),
    [queue],
  );

  async function ingest(files: File[]) {
    if (!files.length) return;
    onBusy("inbox");
    onMessage(null);
    try {
      const items = await ingestFiles(files, role, setProgress, flow.year);
      setQueue((prev) => [...prev, ...items]);
      const errors = items.filter((i) => i.error).length;
      onMessage({
        ok: errors === 0,
        text:
          errors === 0
            ? `Am extras ${items.length} ${items.length === 1 ? "linie" : "linii"}. Verifică și confirmă.`
            : `Am extras ${items.length} linii; ${errors} cer atenție sau completare manuală.`,
      });
    } catch (e) {
      onMessage({ ok: false, text: e instanceof Error ? e.message : "Nu am putut citi fișierele." });
    } finally {
      onBusy(null);
      setProgress(null);
    }
  }

  async function loadExamples(all = true) {
    const list = all ? EXAMPLES : EXAMPLES.slice(0, 1);
    onBusy("inbox");
    try {
      const files: File[] = [];
      for (const ex of list) {
        const res = await fetch(ex.href);
        if (!res.ok) continue;
        const blob = await res.blob();
        files.push(new File([blob], ex.name, { type: blob.type || guessType(ex.name) }));
      }
      await ingest(files);
    } catch {
      onBusy(null);
      onMessage({ ok: false, text: "Nu am putut încărca exemplele." });
    }
  }

  function patch(id: string, next: Partial<IngestCandidate>) {
    setQueue((prev) => prev.map((c) => (c.id === id ? { ...c, ...next } : c)));
  }

  function applyMap(placeholder: IngestCandidate, map: ColumnMap) {
    if (!placeholder.headers || !placeholder.rows) return;
    const made =
      placeholder.source === "xlsx"
        ? applyExcelMap(
            { headers: placeholder.headers, rows: placeholder.rows },
            map,
            placeholder.fileName,
            suggestedIncomeClassification(role),
          )
        : rowsToCandidates(placeholder.headers, placeholder.rows, map, {
            source: placeholder.source,
            fileName: placeholder.fileName,
            fallbackClass: suggestedIncomeClassification(role),
          });
    setQueue((prev) => [...prev.filter((c) => c.id !== placeholder.id), ...made]);
  }

  function addManual() {
    if (!manual.amount) {
      onMessage({ ok: false, text: "Introdu o sumă pentru linia manuală." });
      return;
    }
    setQueue((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        source: "manual",
        fileName: "manual",
        amount: manual.amount,
        date: manual.date || null,
        description: manual.description || "Linie manuală",
        classification: manual.classification,
        confidence: 1,
      },
    ]);
    setManual({ ...manual, amount: 0, description: "" });
    onMessage({ ok: true, text: "Linia manuală e în coadă. Confirmă ca să intre în calcul." });
  }

  function confirm(items: IngestCandidate[]) {
    if (!items.length) {
      onMessage({ ok: false, text: "Nu există linii valide de confirmat." });
      return;
    }
    onApply(applyCandidatesToFlow(flow, items));
    const ids = new Set(items.map((i) => i.id));
    setQueue((prev) => {
      prev.forEach((c) => {
        if (ids.has(c.id) && c.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(c.previewUrl);
      });
      return prev.filter((c) => !ids.has(c.id));
    });
    onMessage({
      ok: true,
      text: `Am confirmat ${items.length} ${items.length === 1 ? "dovadă" : "dovezi"} în inbox.`,
    });
  }

  return (
    <div className="space-y-4">
      <article
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void ingest(Array.from(e.dataTransfer.files));
        }}
        className={`rounded-3xl border-2 border-dashed p-5 ${
          dragOver ? "border-sage bg-mint-soft" : "border-sage/40 bg-white"
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-sage">Încarcă orice</p>
        <h3 className="mt-1 font-display text-2xl text-ink">Inbox universal de dovezi</h3>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Trage aici poze, PDF, CSV, Excel, JSON sau text. Parsarea e locală — nu trimitem fișiere
          către terți. Confirmă fiecare linie. Banca rămâne în curând. Nu depunem la ANAF.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer rounded-full bg-sage px-4 py-2 text-sm font-semibold text-white">
            Alege fișiere
            <input
              type="file"
              multiple
              accept={ACCEPT_ATTR}
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                void ingest(files);
              }}
            />
          </label>
          <label className="inline-flex cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-semibold">
            Fotografiază
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                void ingest(files);
              }}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void loadExamples(true)}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Exemple amestecate
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void loadExamples(false)}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Doar CSV exemplu
          </button>
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          Acceptate: jpg, png, webp, PDF, CSV, xlsx/xls, JSON, txt. Max. 8 MB / fișier.
        </p>
        {progress ? (
          <div className="mt-4 rounded-2xl bg-mint-soft px-3 py-2 text-sm text-sage-deep">
            <p>{progress.status}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
              <div className="h-full bg-sage" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
        ) : null}
      </article>

      <article className="grid gap-3 rounded-3xl border border-line bg-white p-4 sm:grid-cols-2">
        <h3 className="font-display text-xl sm:col-span-2">Linie manuală</h3>
        <Field label="Sumă (lei)">
          <MoneyInput value={manual.amount} onValue={(amount) => setManual({ ...manual, amount })} />
        </Field>
        <Field label="Data">
          <TextInput
            value={manual.date}
            placeholder="2026-03-12"
            onChange={(e) => setManual({ ...manual, date: e.target.value })}
          />
        </Field>
        <Field label="Descriere">
          <TextInput
            value={manual.description}
            placeholder="Consultanță / chirie / bon"
            onChange={(e) => setManual({ ...manual, description: e.target.value })}
          />
        </Field>
        <Field label="Tip">
          <SelectInput
            value={manual.classification}
            onChange={(e) =>
              setManual({ ...manual, classification: e.target.value as EvidenceClass })
            }
          >
            <ClassOptions />
          </SelectInput>
        </Field>
        <button
          type="button"
          onClick={addManual}
          className="rounded-full border border-line px-4 py-2 text-sm font-semibold sm:col-span-2"
        >
          Adaugă în coadă
        </button>
      </article>

      <section className="rounded-3xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="font-display text-xl">Coadă de confirmare</h3>
            <p className="text-sm text-ink-soft">
              {queue.length
                ? `${queue.length} extrase · ${valid.length} gata de confirmat`
                : "Nicio dovadă în așteptare. Trage fișiere sau adaugă o linie."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!valid.length}
              onClick={() => confirm(valid)}
              className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Confirmă liniile valide
            </button>
            {queue.length ? (
              <button
                type="button"
                onClick={() => setQueue([])}
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
              >
                Golește coada
              </button>
            ) : null}
          </div>
        </div>

        {queue.length ? (
          <ul className="mt-4 space-y-3">
            {queue.map((item) => (
              <li key={item.id} className="rounded-2xl border border-line/80 bg-paper/60 p-3">
                <div className="grid gap-3 md:grid-cols-[96px_1fr]">
                  {item.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt=""
                      className="h-24 w-full rounded-xl border border-line bg-white object-cover"
                    />
                  ) : (
                    <div className="flex h-24 items-center justify-center rounded-xl border border-line bg-white text-xs text-ink-soft">
                      {item.source}
                    </div>
                  )}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label="Sumă">
                      <MoneyInput value={item.amount} onValue={(amount) => patch(item.id, { amount })} />
                    </Field>
                    <Field label="Data">
                      <TextInput
                        value={item.date ?? ""}
                        onChange={(e) => patch(item.id, { date: e.target.value || null })}
                      />
                    </Field>
                    <Field label="Descriere">
                      <TextInput
                        value={item.description}
                        onChange={(e) => patch(item.id, { description: e.target.value })}
                      />
                    </Field>
                    <Field label="Clasificare">
                      <SelectInput
                        value={item.classification}
                        onChange={(e) =>
                          patch(item.id, { classification: e.target.value as EvidenceClass })
                        }
                      >
                        <ClassOptions />
                      </SelectInput>
                    </Field>
                  </div>
                </div>
                <p className="mt-2 text-xs text-ink-soft">
                  {item.fileName} · {Math.round(item.confidence * 100)}%
                  {item.amount ? ` · ${formatRon(item.amount, true)}` : ""}
                </p>
                {item.error ? <p className="mt-1 text-xs text-overdue">{item.error}</p> : null}
                {item.needsMapping && item.headers ? (
                  <ColumnMapper headers={item.headers} onApply={(map) => applyMap(item, map)} />
                ) : null}
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-ink-soft"
                  onClick={() => setQueue((prev) => prev.filter((c) => c.id !== item.id))}
                >
                  Scoate din coadă
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function ClassOptions() {
  return (
    <>
      {(Object.keys(CLASS_LABELS) as EvidenceClass[])
        .filter((k) => k !== "other")
        .map((key) => (
          <option key={key} value={key}>
            {CLASS_LABELS[key]}
          </option>
        ))}
    </>
  );
}

function ColumnMapper({
  headers,
  onApply,
}: {
  headers: string[];
  onApply: (map: ColumnMap) => void;
}) {
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState<number | null>(null);
  const [description, setDescription] = useState<number | null>(null);
  return (
    <div className="mt-3 grid gap-2 rounded-xl bg-white p-3 sm:grid-cols-3">
      <p className="text-xs font-medium sm:col-span-3">Mapare coloane</p>
      <Field label="Coloană sumă">
        <SelectInput value={String(amount)} onChange={(e) => setAmount(Number(e.target.value))}>
          {headers.map((h, i) => (
            <option key={`${h}-${i}`} value={i}>
              {h || `Col ${i + 1}`}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Coloană dată">
        <SelectInput
          value={date == null ? "" : String(date)}
          onChange={(e) => setDate(e.target.value === "" ? null : Number(e.target.value))}
        >
          <option value="">—</option>
          {headers.map((h, i) => (
            <option key={`${h}-${i}`} value={i}>
              {h || `Col ${i + 1}`}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Coloană descriere">
        <SelectInput
          value={description == null ? "" : String(description)}
          onChange={(e) => setDescription(e.target.value === "" ? null : Number(e.target.value))}
        >
          <option value="">—</option>
          {headers.map((h, i) => (
            <option key={`${h}-${i}`} value={i}>
              {h || `Col ${i + 1}`}
            </option>
          ))}
        </SelectInput>
      </Field>
      <button
        type="button"
        onClick={() => onApply({ amount, date, description, tip: null })}
        className="rounded-full bg-sage px-3 py-2 text-sm font-semibold text-white sm:col-span-3"
      >
        Aplică maparea
      </button>
    </div>
  );
}

function guessType(name: string): string {
  if (name.endsWith(".csv")) return "text/csv";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return "";
}
