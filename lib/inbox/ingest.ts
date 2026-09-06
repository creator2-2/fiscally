"use client";

import { recognizeFile } from "../ocr/run";
import { suggestedIncomeClassification, suggestedOcrClassification } from "../ocr/apply";
import type { FilerRole } from "../du-flow";
import { csvToCandidates } from "./csv";
import { assertFileSize, routeErrorMessage, routeFile } from "./route";
import { parseJsonEvidence, parsePlainTextEvidence } from "./text";
import type { EvidenceClass, IngestCandidate } from "./types";

export interface IngestProgress {
  fileName: string;
  index: number;
  total: number;
  percent: number;
  status: string;
}

function incomeClass(role: FilerRole | null): EvidenceClass {
  return suggestedIncomeClassification(role);
}

function receiptClass(role: FilerRole | null): EvidenceClass {
  return suggestedOcrClassification(role);
}

async function ingestOne(
  file: File,
  role: FilerRole | null,
  onProgress?: (p: { percent: number; status: string }) => void,
): Promise<IngestCandidate[]> {
  assertFileSize(file);
  const route = routeFile(file);
  if (route === "unknown") {
    return [
      {
        id: `unknown-${file.name}`,
        source: "manual",
        fileName: file.name,
        amount: 0,
        date: null,
        description: file.name,
        classification: "ignore",
        confidence: 0,
        error: routeErrorMessage(file),
      },
    ];
  }

  if (route === "image" || route === "pdf") {
    try {
      const draft = await recognizeFile(file, onProgress);
      return [
        {
          id: `ocr-${file.name}-${Date.now()}`,
          source: route === "pdf" ? "pdf" : "ocr",
          fileName: file.name,
          amount: draft.amount,
          date: draft.date,
          description: draft.merchant || file.name,
          classification: receiptClass(role),
          confidence: draft.confidence,
          rawText: draft.rawText,
          previewUrl: draft.previewUrl,
          error: draft.amount
            ? undefined
            : "Nu am găsit o sumă clară. Completează manual înainte de confirmare.",
        },
      ];
    } catch (e) {
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
      return [
        {
          id: `ocr-fail-${file.name}`,
          source: route === "pdf" ? "pdf" : "ocr",
          fileName: file.name,
          amount: 0,
          date: null,
          description: file.name,
          classification: receiptClass(role),
          confidence: 0,
          previewUrl,
          error: e instanceof Error ? e.message : "Nu am putut citi documentul. Completează manual.",
        },
      ];
    }
  }

  if (route === "csv") {
    const text = await file.text();
    const parsed = csvToCandidates(text, file.name, incomeClass(role));
    return parsed.candidates;
  }

  if (route === "xlsx") {
    const { parseWorkbook } = await import("./excel");
    const data = await file.arrayBuffer();
    const parsed = parseWorkbook(data, file.name, incomeClass(role));
    if (!parsed.map) {
      return [
        {
          id: `xlsx-map-${file.name}`,
          source: "xlsx",
          fileName: file.name,
          amount: 0,
          date: null,
          description: `${file.name} · ${parsed.sheet}`,
          classification: incomeClass(role),
          confidence: 0,
          needsMapping: true,
          headers: parsed.headers,
          rows: parsed.rows,
          error: "Nu am recunoscut coloanele din Excel. Alege suma, data și descrierea.",
        },
      ];
    }
    return parsed.candidates;
  }

  if (route === "json") {
    const text = await file.text();
    const items = parseJsonEvidence(text, file.name, incomeClass(role));
    if (!items.length) {
      return [
        {
          id: `json-empty-${file.name}`,
          source: "json",
          fileName: file.name,
          amount: 0,
          date: null,
          description: file.name,
          classification: incomeClass(role),
          confidence: 0,
          error: "JSON-ul nu are sume recunoscute (amount / suma / total).",
        },
      ];
    }
    return items;
  }

  const text = await file.text();
  const items = parsePlainTextEvidence(text, file.name, receiptClass(role));
  if (!items.length) {
    return [
      {
        id: `txt-empty-${file.name}`,
        source: "txt",
        fileName: file.name,
        amount: 0,
        date: null,
        description: file.name,
        classification: receiptClass(role),
        confidence: 0,
        rawText: text.slice(0, 2000),
        error: "Nu am extras sume din text. Completează manual.",
      },
    ];
  }
  return items;
}

export async function ingestFiles(
  files: File[],
  role: FilerRole | null,
  onProgress?: (p: IngestProgress) => void,
): Promise<IngestCandidate[]> {
  const out: IngestCandidate[] = [];
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    onProgress?.({
      fileName: file.name,
      index: i + 1,
      total: files.length,
      percent: Math.round((i / files.length) * 100),
      status: `Se citește ${file.name} (${i + 1}/${files.length})…`,
    });
    const items = await ingestOne(file, role, (p) =>
      onProgress?.({
        fileName: file.name,
        index: i + 1,
        total: files.length,
        percent: Math.round(((i + p.percent / 100) / files.length) * 100),
        status: `${file.name}: ${p.status}`,
      }),
    );
    out.push(...items);
  }
  return out;
}
