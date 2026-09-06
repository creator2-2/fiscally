"use client";

import { useState } from "react";
import { Field, MoneyInput, SelectInput, TextInput } from "@/components/Fields";
import { applyOcrToFlow, suggestedOcrClassification } from "@/lib/ocr/apply";
import { confidenceLabel } from "@/lib/ocr/parse";
import { recognizeFile, type OcrProgress } from "@/lib/ocr/run";
import { OCR_CLASS_LABELS, type OcrClassification, type OcrDraft } from "@/lib/ocr/types";
import type { DuFlowState, FilerRole } from "@/lib/du-flow";
import { formatRon } from "@/lib/format";

export function OcrInbox({
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
  const [draft, setDraft] = useState<OcrDraft | null>(null);
  const [progress, setProgress] = useState<OcrProgress | null>(null);

  async function run(file: File | null) {
    if (!file) return;
    onBusy("ocr");
    onMessage(null);
    setProgress({ percent: 5, status: "Se pregătește imaginea…" });
    try {
      const next = await recognizeFile(file, setProgress);
      next.classification = suggestedOcrClassification(role);
      setDraft(next);
      onMessage({
        ok: true,
        text: next.amount
          ? `Am citit ${formatRon(next.amount, true)}. Verifică și confirmă — OCR poate greși.`
          : "Am extras text, dar nu am găsit o sumă clară. Completează manual.",
      });
    } catch (e) {
      setDraft(null);
      onMessage({
        ok: false,
        text: e instanceof Error ? e.message : "Nu am putut citi documentul.",
      });
    } finally {
      onBusy(null);
      setProgress(null);
    }
  }

  async function loadExample() {
    onBusy("ocr");
    setProgress({ percent: 8, status: "Se încarcă exemplul…" });
    try {
      const res = await fetch("/examples/chitanta-demo.png");
      if (!res.ok) throw new Error("Nu am găsit exemplul de chitanță.");
      const blob = await res.blob();
      const file = new File([blob], "chitanta-demo.png", { type: "image/png" });
      await run(file);
    } catch (e) {
      onBusy(null);
      setProgress(null);
      onMessage({
        ok: false,
        text: e instanceof Error ? e.message : "Nu am putut încărca exemplul.",
      });
    }
  }

  function confirm() {
    if (!draft) return;
    if (!draft.amount) {
      onMessage({ ok: false, text: "Introdu o sumă înainte de confirmare." });
      return;
    }
    onApply(
      applyOcrToFlow(flow, {
        label: draft.label,
        amount: draft.amount,
        date: draft.date,
        merchant: draft.merchant,
        confidence: draft.confidence,
        classification: draft.classification,
        rawText: draft.rawText,
      }),
    );
    if (draft.previewUrl.startsWith("blob:")) URL.revokeObjectURL(draft.previewUrl);
    setDraft(null);
    const where =
      draft.classification === "pfa-expense"
        ? "cheltuieli PFA"
        : draft.classification === "pf-income"
          ? "venituri PF"
          : "inbox (fără calcul)";
    onMessage({
      ok: true,
      text: `Chitanță confirmată: ${formatRon(draft.amount, true)} la ${where}.`,
    });
  }

  const mark = draft ? confidenceLabel(draft.confidence) : null;

  return (
    <article className="rounded-3xl border border-sage/30 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-sage">Nou</p>
      <h3 className="mt-1 font-display text-xl">Poză / PDF chitanță (OCR)</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Motorul rulează în browser. Nu trimitem chitanța către un serviciu terț. OCR-ul poate greși —
        confirmă mereu suma.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer rounded-full bg-sage px-4 py-2 text-sm font-semibold text-white">
          Încarcă poză sau PDF
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              e.target.value = "";
              void run(file);
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
              const file = e.target.files?.[0] ?? null;
              e.target.value = "";
              void run(file);
            }}
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void loadExample()}
          className="rounded-full border border-line px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Exemplu de test
        </button>
      </div>

      {progress ? (
        <div className="mt-4 rounded-2xl bg-mint-soft px-3 py-2 text-sm text-sage-deep">
          <p>{progress.status}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full bg-sage transition-[width]" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      ) : null}

      {draft ? (
        <div className="mt-4 grid gap-4 rounded-2xl border border-line bg-paper/70 p-3 md:grid-cols-[160px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={draft.previewUrl}
            alt="Previzualizare chitanță"
            className="h-40 w-full rounded-xl border border-line object-cover bg-white"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sumă (lei)">
              <MoneyInput value={draft.amount} onValue={(amount) => setDraft({ ...draft, amount })} />
            </Field>
            <Field label="Data">
              <TextInput
                value={draft.date ?? ""}
                placeholder="2026-03-12"
                onChange={(e) => setDraft({ ...draft, date: e.target.value || null })}
              />
            </Field>
            <Field label="Comerciant / text">
              <TextInput
                value={draft.merchant}
                onChange={(e) => setDraft({ ...draft, merchant: e.target.value })}
              />
            </Field>
            <Field label="Clasificare">
              <SelectInput
                value={draft.classification}
                onChange={(e) =>
                  setDraft({ ...draft, classification: e.target.value as OcrClassification })
                }
              >
                {(Object.keys(OCR_CLASS_LABELS) as OcrClassification[]).map((key) => (
                  <option key={key} value={key}>
                    {OCR_CLASS_LABELS[key]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            {mark ? (
              <p
                className={`sm:col-span-2 text-xs font-medium ${
                  mark.tone === "good"
                    ? "text-sage-deep"
                    : mark.tone === "low"
                      ? "text-overdue"
                      : "text-ink-soft"
                }`}
              >
                {mark.text} · {Math.round(draft.confidence * 100)}%
                {draft.source === "pdf-text" ? " · text extras din PDF" : " · Tesseract local"}
              </p>
            ) : null}
            <details className="sm:col-span-2 text-xs text-ink-soft">
              <summary className="cursor-pointer font-medium text-ink">Text recunoscut</summary>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-2">
                {draft.rawText || "—"}
              </pre>
            </details>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={confirm}
                className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-white"
              >
                Confirmă în inbox
              </button>
              <button
                type="button"
                onClick={() => {
                  if (draft.previewUrl.startsWith("blob:")) URL.revokeObjectURL(draft.previewUrl);
                  setDraft(null);
                }}
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
              >
                Renunță
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
