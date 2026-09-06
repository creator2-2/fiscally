import { parseReceiptText, parseRoAmount, parseRoDate } from "../ocr/parse";
import type { EvidenceClass, IngestCandidate } from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pick(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const found = Object.keys(row).find((k) => k.toLowerCase() === key);
    if (found != null && row[found] != null) return String(row[found]);
  }
  return "";
}

function jsonRowToCandidate(
  row: Record<string, unknown>,
  index: number,
  fileName: string,
  fallbackClass: EvidenceClass,
): IngestCandidate | null {
  const amount =
    parseRoAmount(pick(row, ["amount", "suma", "sumă", "total", "valoare", "lei"])) ??
    Number(pick(row, ["amount", "suma", "total", "valoare"]) || 0);
  if (!amount) return null;
  const dateRaw = pick(row, ["date", "data", "issued"]);
  return {
    id: `json-${fileName}-${index}`,
    source: "json",
    fileName,
    amount: Math.round(Math.abs(amount) * 100) / 100,
    date: parseRoDate(dateRaw) ?? (/^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : null),
    description: pick(row, ["description", "descriere", "client", "label", "merchant"]) || fileName,
    classification: fallbackClass,
    confidence: 0.75,
    rawText: JSON.stringify(row),
  };
}

export function parseJsonEvidence(text: string, fileName: string, fallbackClass: EvidenceClass): IngestCandidate[] {
  const parsed = JSON.parse(text) as unknown;
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(asRecord(parsed)?.items)
      ? (asRecord(parsed)?.items as unknown[])
      : asRecord(parsed)
        ? [parsed]
        : [];
  return list
    .map((item, i) => {
      const rec = asRecord(item);
      return rec ? jsonRowToCandidate(rec, i, fileName, fallbackClass) : null;
    })
    .filter((c): c is IngestCandidate => Boolean(c));
}

export function parsePlainTextEvidence(
  text: string,
  fileName: string,
  fallbackClass: EvidenceClass,
): IngestCandidate[] {
  const receipt = parseReceiptText(text);
  if (receipt.amount) {
    return [
      {
        id: `txt-${fileName}-0`,
        source: "txt",
        fileName,
        amount: receipt.amount,
        date: receipt.date,
        description: receipt.merchant || fileName,
        classification: fallbackClass,
        confidence: receipt.confidence,
        rawText: text.slice(0, 2000),
      },
    ];
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: IngestCandidate[] = [];
  lines.forEach((line, i) => {
    const dateMatch = line.match(/\b(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})\b/);
    const amountMatch = line.match(/(\d{1,3}(?:[.\s]\d{3})+,\d{2}|\d+,\d{2}|\d+\.\d{2}|\d+)/);
    if (!amountMatch) return;
    const amount = parseRoAmount(amountMatch[1]);
    if (!amount || amount < 1) return;
    const date = dateMatch
      ? parseRoDate(dateMatch[1]) ?? (/^\d{4}-\d{2}-\d{2}$/.test(dateMatch[1]) ? dateMatch[1] : null)
      : null;
    out.push({
      id: `txt-${fileName}-${i}`,
      source: "txt",
      fileName,
      amount,
      date,
      description: line.replace(amountMatch[0], "").replace(dateMatch?.[0] ?? "", "").trim() || fileName,
      classification: fallbackClass,
      confidence: 0.45,
      rawText: line,
    });
  });
  return out;
}
