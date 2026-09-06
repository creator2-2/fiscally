import type { OcrClassification } from "../ocr/types";

export type EvidenceClass = OcrClassification;
export type IngestSource = "ocr" | "pdf" | "csv" | "xlsx" | "txt" | "json" | "manual";
export type FileRoute = IngestSource | "image" | "unknown";

export interface IngestCandidate {
  id: string;
  source: IngestSource;
  fileName: string;
  amount: number;
  date: string | null;
  description: string;
  classification: EvidenceClass;
  confidence: number;
  rawText?: string;
  previewUrl?: string;
  error?: string;
  needsMapping?: boolean;
  headers?: string[];
  rows?: string[][];
}

export interface ColumnMap {
  amount: number;
  date: number | null;
  description: number | null;
  tip: number | null;
}

export const CLASS_LABELS: Record<EvidenceClass, string> = {
  "pfa-expense": "Cheltuială PFA",
  "pfa-income": "Venit PFA",
  "pf-income": "Venit PF",
  ignore: "Ignoră",
  other: "Altele (doar în inbox)",
};

export const ACCEPT_ATTR =
  ".csv,.xlsx,.xls,.json,.txt,.pdf,image/jpeg,image/png,image/webp,text/csv,application/pdf,application/json,text/plain";
