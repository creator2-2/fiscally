import type { DuFlowState, EvidenceItem, EvidenceKind } from "../du-flow";
import type { FilerRole } from "../du-flow";
import { includesPf, includesPfa } from "../du-flow";
import type { IngestCandidate } from "../inbox/types";
import type { OcrClassification } from "./types";

export function defaultOcrClassification(role: FilerRole | null): OcrClassification {
  if (role === "pf") return "pf-income";
  return "pfa-expense";
}

export function suggestedIncomeClassification(role: FilerRole | null): OcrClassification {
  if (includesPf(role) && !includesPfa(role)) return "pf-income";
  return "pfa-income";
}

export function suggestedOcrClassification(role: FilerRole | null): OcrClassification {
  if (includesPf(role) && !includesPfa(role)) return "pf-income";
  return defaultOcrClassification(role);
}

function applyAmount(flow: DuFlowState, classification: OcrClassification, amount: number, sign: 1 | -1): DuFlowState {
  const delta = sign * amount;
  const round = (n: number) => Math.max(0, Math.round(n * 100) / 100);
  if (classification === "pfa-expense") {
    return { ...flow, pfaExpenses: round(flow.pfaExpenses + delta) };
  }
  if (classification === "pfa-income") {
    return { ...flow, pfaIncome: round(flow.pfaIncome + delta) };
  }
  if (classification === "pf-income") {
    return { ...flow, pfOtherIncome: round(flow.pfOtherIncome + delta) };
  }
  return flow;
}

function classNote(classification: OcrClassification): string {
  switch (classification) {
    case "pfa-expense":
      return "Cheltuială PFA";
    case "pfa-income":
      return "Venit PFA";
    case "pf-income":
      return "Venit PF";
    case "ignore":
      return "Ignorat, neinclus în calcul";
    default:
      return "Dovadă, neinclusă în calcul";
  }
}

export function applyClassifiedLine(
  flow: DuFlowState,
  input: {
    kind: EvidenceKind;
    label: string;
    amount: number;
    date: string | null;
    merchant?: string;
    confidence?: number;
    classification: OcrClassification;
    rawText?: string;
    note?: string;
  },
): DuFlowState {
  const item: EvidenceItem = {
    id: `${input.kind}-${Date.now()}-${Math.round(Math.random() * 10000)}`,
    kind: input.kind,
    label: input.merchant || input.label,
    year: flow.year,
    addedAt: new Date().toISOString(),
    total: input.amount,
    note:
      input.note ??
      [classNote(input.classification), input.date ? `dată ${input.date}` : null]
        .filter(Boolean)
        .join(" · "),
    classification: input.classification,
    ocr: input.rawText
      ? {
          amount: input.amount,
          date: input.date,
          merchant: input.merchant || input.label,
          confidence: input.confidence ?? 0.5,
          rawText: input.rawText.slice(0, 2000),
        }
      : undefined,
  };
  const next =
    input.classification === "ignore" || input.classification === "other"
      ? flow
      : applyAmount(flow, input.classification, input.amount, 1);
  return {
    ...next,
    evidence: [...flow.evidence, item],
    step: flow.step < 3 ? 3 : flow.step,
  };
}

export function applyOcrToFlow(
  flow: DuFlowState,
  input: {
    label: string;
    amount: number;
    date: string | null;
    merchant: string;
    confidence: number;
    classification: OcrClassification;
    rawText?: string;
  },
): DuFlowState {
  return applyClassifiedLine(flow, {
    kind: "ocr",
    label: input.label,
    amount: input.amount,
    date: input.date,
    merchant: input.merchant,
    confidence: input.confidence,
    classification: input.classification,
    rawText: input.rawText,
    note: [
      classNote(input.classification) + " din chitanță",
      input.date ? `dată ${input.date}` : null,
      `încredere ${Math.round(input.confidence * 100)}%`,
    ]
      .filter(Boolean)
      .join(" · "),
  });
}

export function applyCandidatesToFlow(flow: DuFlowState, candidates: IngestCandidate[]): DuFlowState {
  return candidates.reduce(
    (acc, c, i) =>
      applyClassifiedLine(acc, {
        kind: c.source,
        label: c.description || c.fileName,
        amount: c.amount,
        date: c.date,
        merchant: c.description,
        confidence: c.confidence,
        classification: c.classification,
        rawText: c.rawText,
        note: [classNote(c.classification), c.source, c.date ? `dată ${c.date}` : null, c.fileName, `#${i}`]
          .filter(Boolean)
          .join(" · "),
      }),
    flow,
  );
}

export function removeEvidenceFromFlow(flow: DuFlowState, id: string): DuFlowState {
  const item = flow.evidence.find((e) => e.id === id);
  const evidence = flow.evidence.filter((e) => e.id !== id);
  if (!item || !item.classification || item.total == null) {
    return { ...flow, evidence };
  }
  return { ...applyAmount(flow, item.classification, item.total, -1), evidence };
}
