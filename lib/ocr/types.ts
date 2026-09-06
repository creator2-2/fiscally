export type OcrClassification = "pfa-expense" | "pf-income" | "other";

export const OCR_CLASS_LABELS: Record<OcrClassification, string> = {
  "pfa-expense": "Cheltuială PFA",
  "pf-income": "Venit PF",
  other: "Altele (doar în inbox)",
};

export interface OcrDraft {
  label: string;
  amount: number;
  date: string | null;
  merchant: string;
  confidence: number;
  classification: OcrClassification;
  rawText: string;
  previewUrl: string;
  source: "ocr" | "pdf-text";
}
