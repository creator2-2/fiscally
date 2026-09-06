import { parseRoAmount, parseRoDate } from "../ocr/parse";
import type { EvidenceClass } from "./types";
import type { ColumnMap, IngestCandidate, IngestSource } from "./types";

const AMOUNT_H = /^(total|valoare|suma|sumă|amount|lei|ron|value)$/i;
const DATE_H = /^(date|data|issued|zi|emis)$/i;
const DESC_H = /^(descriere|description|client|denumire|detalii|label|merchant|nume|text)$/i;
const TIP_H = /^(tip|type|kind|clasificare|categorie)$/i;

export function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "");
}

export function guessColumnMap(headers: string[]): ColumnMap | null {
  const amount = headers.findIndex((h) => AMOUNT_H.test(normalizeHeader(h)));
  if (amount < 0) return null;
  const dateIdx = headers.findIndex((h) => DATE_H.test(normalizeHeader(h)));
  const description = headers.findIndex((h) => DESC_H.test(normalizeHeader(h)));
  const tip = headers.findIndex((h) => TIP_H.test(normalizeHeader(h)));
  return {
    amount,
    date: dateIdx >= 0 ? dateIdx : null,
    description: description >= 0 ? description : null,
    tip: tip >= 0 ? tip : null,
  };
}

export function classifyTip(raw: string, fallback: EvidenceClass): EvidenceClass {
  const v = raw.toLowerCase();
  if (/ignor|skip|anulat|proform/.test(v)) return "ignore";
  if (/cheltuial|expense|bon|chitan/.test(v)) return "pfa-expense";
  if (/venit\s*pf|pf\b|chirie|chirii/.test(v)) return "pf-income";
  if (/venit|factura|încas|incas|income/.test(v)) return "pfa-income";
  return fallback;
}

function cellDate(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  return parseRoDate(v);
}

export function rowsToCandidates(
  headers: string[],
  rows: string[][],
  map: ColumnMap,
  meta: { source: IngestSource; fileName: string; fallbackClass: EvidenceClass },
): IngestCandidate[] {
  return rows
    .map((row, index) => {
      const amount = parseRoAmount(String(row[map.amount] ?? "")) ?? Number(row[map.amount] || 0);
      const date = map.date != null ? cellDate(String(row[map.date] ?? "")) : null;
      const description =
        map.description != null
          ? String(row[map.description] ?? "").trim()
          : `${meta.fileName} · rând ${index + 1}`;
      const tipRaw = map.tip != null ? String(row[map.tip] ?? "") : "";
      return {
        id: `${meta.source}-${meta.fileName}-${index}-${Math.abs(amount)}`,
        source: meta.source,
        fileName: meta.fileName,
        amount: Math.round(Math.abs(amount) * 100) / 100,
        date,
        description: description || `${meta.fileName} · rând ${index + 1}`,
        classification: classifyTip(tipRaw, amount < 0 ? "pfa-expense" : meta.fallbackClass),
        confidence: amount ? 0.8 : 0.2,
        rawText: row.join(" | "),
      } satisfies IngestCandidate;
    })
    .filter((c) => c.amount > 0 || c.description);
}

export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === "," || ch === ";" || ch === "\t") && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

export function parseCsvTable(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map(splitCsvLine);
  return { headers, rows };
}
