import type { ImportedInvoice, ImportSummary, InvoiceKindImported, MonthBucket } from "./types";

const MONTHS_RO = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];

export function normalizeCif(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function parseSignedMoney(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function classifyKind(raw: string): InvoiceKindImported {
  const v = raw.trim().toLowerCase();
  if (v.includes("storno") || v.includes("reverse")) return "storno";
  if (v.includes("proform") || v.includes("estimat")) return "proforma";
  if (v.includes("factur") || v === "invoice" || v === "") return "factura";
  return "alta";
}

export function countsTowardIncome(kind: InvoiceKindImported, status: string): boolean {
  const s = status.toLowerCase();
  if (s.includes("anulat") || s.includes("cancel") || s.includes("draft") || s.includes("ciorna")) {
    return false;
  }
  if (kind === "proforma" || kind === "alta") return false;
  return kind === "factura" || kind === "storno";
}

export function yearOf(iso: string): number | null {
  const m = /^(\d{4})/.exec(iso);
  if (!m) return null;
  return Number(m[1]);
}

export function monthOf(iso: string): number | null {
  const m = /^\d{4}-(\d{2})/.exec(iso);
  if (!m) return null;
  const month = Number(m[1]);
  return month >= 1 && month <= 12 ? month : null;
}

export function aggregateImport(
  invoices: ImportedInvoice[],
  year: number,
  source: ImportSummary["source"],
  note: string,
): ImportSummary {
  const inYear = invoices.filter((inv) => yearOf(inv.date) === year);
  const included = inYear.filter((inv) => inv.countsTowardIncome);
  const months: MonthBucket[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: MONTHS_RO[i],
    count: 0,
    total: 0,
    vat: 0,
  }));

  for (const inv of included) {
    const m = monthOf(inv.date);
    if (!m) continue;
    const bucket = months[m - 1];
    bucket.count += 1;
    bucket.total += inv.total;
    bucket.vat += inv.vat;
  }

  const totalIncome = included.reduce((sum, inv) => sum + inv.total, 0);
  const totalVat = included.reduce((sum, inv) => sum + inv.vat, 0);

  return {
    source,
    year,
    invoiceCount: inYear.length,
    includedCount: included.length,
    skippedCount: inYear.length - included.length,
    totalIncome,
    totalVat,
    months: months.filter((b) => b.count > 0 || b.total !== 0),
    invoices: inYear,
    importedAt: new Date().toISOString(),
    note,
  };
}
