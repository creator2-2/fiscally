import { classifyKind, countsTowardIncome, parseSignedMoney } from "./normalize";
import type { ImportedInvoice } from "./types";

const ALIASES: Record<string, string> = {
  date: "date",
  data: "date",
  issued: "date",
  series: "series",
  serie: "series",
  number: "number",
  numar: "number",
  număr: "number",
  client: "client",
  clientname: "client",
  clientcui: "clientCui",
  cui_client: "clientCui",
  cuiclient: "clientCui",
  total: "total",
  valoare: "total",
  amount: "total",
  vat: "vat",
  tva: "vat",
  currency: "currency",
  moneda: "currency",
  type: "kind",
  tip: "kind",
  kind: "kind",
  status: "status",
  stare: "status",
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "").replace(/"/g, "");
}

function splitCsvLine(line: string): string[] {
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
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

export function parseInvoiceCsv(text: string): ImportedInvoice[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    throw new Error("Fișierul CSV trebuie să aibă un antet și cel puțin un rând.");
  }

  const headers = splitCsvLine(lines[0]).map((h) => ALIASES[normalizeHeader(h)] ?? normalizeHeader(h));
  const required = ["date", "total"];
  for (const key of required) {
    if (!headers.includes(key)) {
      throw new Error(`Lipsește coloana obligatorie „${key}” (sau alias: data / valoare).`);
    }
  }

  return lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    const kind = classifyKind(row.kind ?? row.type ?? "factura");
    const status = row.status || "emisa";
    const date = normalizeDate(row.date);
    return {
      id: `${row.series || "CSV"}-${row.number || index + 1}-${date}`,
      date,
      series: row.series || "",
      number: row.number || String(index + 1),
      client: row.client || "",
      clientCui: row.clientCui || "",
      total: parseSignedMoney(row.total),
      vat: parseSignedMoney(row.vat || "0"),
      currency: (row.currency || "RON").toUpperCase(),
      kind,
      status,
      countsTowardIncome: countsTowardIncome(kind, status),
    };
  });
}

function normalizeDate(raw: string): string {
  const v = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const ro = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(v);
  if (ro) {
    return `${ro[3]}-${ro[2].padStart(2, "0")}-${ro[1].padStart(2, "0")}`;
  }
  throw new Error(`Dată invalidă: ${raw}. Folosește YYYY-MM-DD sau ZZ.LL.AAAA.`);
}

export const CSV_COLUMNS_HELP = [
  { key: "date / data", required: true, hint: "YYYY-MM-DD sau ZZ.LL.AAAA" },
  { key: "total / valoare", required: true, hint: "Total document (storno negativ)" },
  { key: "series / serie", required: false, hint: "Seria facturii" },
  { key: "number / numar", required: false, hint: "Numărul documentului" },
  { key: "client", required: false, hint: "Nume client" },
  { key: "clientCui / cui_client", required: false, hint: "CIF client" },
  { key: "vat / tva", required: false, hint: "TVA din document" },
  { key: "currency / moneda", required: false, hint: "Implicit RON" },
  { key: "type / tip", required: false, hint: "factura | proforma | storno" },
  { key: "status / stare", required: false, hint: "emisa | anulata | draft" },
] as const;
