import { parseInvoiceCsv } from "../smartbill/csv";
import type { EvidenceClass, IngestCandidate } from "./types";
import { guessColumnMap, parseCsvTable, rowsToCandidates } from "./tabular";

export function csvToCandidates(
  text: string,
  fileName: string,
  fallbackClass: EvidenceClass,
): { candidates: IngestCandidate[]; headers?: string[]; rows?: string[][]; needsMapping: boolean } {
  try {
    const invoices = parseInvoiceCsv(text);
    return {
      needsMapping: false,
      candidates: invoices.map((inv, i) => ({
        id: `csv-${fileName}-${i}`,
        source: "csv" as const,
        fileName,
        amount: Math.abs(inv.total),
        date: inv.date,
        description: inv.client || `${inv.series}${inv.number ? ` ${inv.number}` : fileName}`,
        classification: inv.countsTowardIncome ? fallbackClass : ("ignore" as const),
        confidence: 0.88,
        rawText: `${inv.date} ${inv.total} ${inv.client}`,
      })),
    };
  } catch {
    const table = parseCsvTable(text);
    const map = guessColumnMap(table.headers);
    if (!map) {
      return {
        needsMapping: true,
        headers: table.headers,
        rows: table.rows,
        candidates: [
          {
            id: `csv-${fileName}-map`,
            source: "csv",
            fileName,
            amount: 0,
            date: null,
            description: fileName,
            classification: fallbackClass,
            confidence: 0,
            needsMapping: true,
            headers: table.headers,
            rows: table.rows,
            error: "Nu am recunoscut coloanele. Alege care e suma, data și descrierea.",
          },
        ],
      };
    }
    return {
      needsMapping: false,
      candidates: rowsToCandidates(table.headers, table.rows, map, {
        source: "csv",
        fileName,
        fallbackClass,
      }),
    };
  }
}
