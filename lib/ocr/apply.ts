import {
  includesPf,
  includesPfa,
  type DuFlowState,
  type EvidenceItem,
} from "../du-flow";
import type { FilerRole } from "../du-flow";
import type { OcrClassification } from "./types";

export function defaultOcrClassification(role: FilerRole | null): OcrClassification {
  if (role === "pf") return "pf-income";
  return "pfa-expense";
}

function applyAmount(flow: DuFlowState, classification: OcrClassification, amount: number, sign: 1 | -1): DuFlowState {
  const delta = sign * amount;
  if (classification === "pfa-expense") {
    return { ...flow, pfaExpenses: Math.max(0, Math.round((flow.pfaExpenses + delta) * 100) / 100) };
  }
  if (classification === "pf-income") {
    return { ...flow, pfOtherIncome: Math.max(0, Math.round((flow.pfOtherIncome + delta) * 100) / 100) };
  }
  return flow;
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
  const item: EvidenceItem = {
    id: `ocr-${Date.now()}`,
    kind: "ocr",
    label: input.merchant || input.label,
    year: flow.year,
    addedAt: new Date().toISOString(),
    total: input.amount,
    note: [
      input.classification === "pfa-expense"
        ? "Cheltuială PFA din chitanță"
        : input.classification === "pf-income"
          ? "Venit PF din chitanță"
          : "Dovadă OCR, neinclusă în calcul",
      input.date ? `dată ${input.date}` : null,
      `încredere ${Math.round(input.confidence * 100)}%`,
    ]
      .filter(Boolean)
      .join(" · "),
    classification: input.classification,
    ocr: {
      amount: input.amount,
      date: input.date,
      merchant: input.merchant,
      confidence: input.confidence,
      rawText: (input.rawText ?? "").slice(0, 2000),
    },
  };
  const next = applyAmount(flow, input.classification, input.amount, 1);
  return {
    ...next,
    evidence: [...flow.evidence, item],
    step: flow.step < 3 ? 3 : flow.step,
  };
}

export function removeEvidenceFromFlow(flow: DuFlowState, id: string): DuFlowState {
  const item = flow.evidence.find((e) => e.id === id);
  const evidence = flow.evidence.filter((e) => e.id !== id);
  if (!item || item.kind !== "ocr" || !item.classification || item.total == null) {
    return { ...flow, evidence };
  }
  return { ...applyAmount(flow, item.classification, item.total, -1), evidence };
}

export function suggestedOcrClassification(role: FilerRole | null): OcrClassification {
  if (includesPf(role) && !includesPfa(role)) return "pf-income";
  return defaultOcrClassification(role);
}
