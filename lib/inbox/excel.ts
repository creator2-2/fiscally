import * as XLSX from "xlsx";
import type { ColumnMap, EvidenceClass, IngestCandidate } from "./types";
import { guessColumnMap, rowsToCandidates } from "./tabular";

export interface ExcelParseResult {
  sheet: string;
  headers: string[];
  rows: string[][];
  map: ColumnMap | null;
  candidates: IngestCandidate[];
}

function sheetToMatrix(sheet: XLSX.WorkSheet): string[][] {
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  });
  return rows.map((row) => row.map((cell) => String(cell ?? "").trim()));
}

export function parseWorkbook(
  data: ArrayBuffer,
  fileName: string,
  fallbackClass: EvidenceClass,
): ExcelParseResult {
  const wb = XLSX.read(data, { type: "array", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new Error("Registrul Excel nu are nicio foaie.");
  }
  const matrix = sheetToMatrix(wb.Sheets[sheetName]);
  if (matrix.length < 2) {
    throw new Error("Foaia Excel trebuie să aibă antet și cel puțin un rând.");
  }
  const headers = matrix[0];
  const rows = matrix.slice(1);
  const map = guessColumnMap(headers);
  const candidates = map
    ? rowsToCandidates(headers, rows, map, { source: "xlsx", fileName, fallbackClass })
    : [];
  return { sheet: sheetName, headers, rows, map, candidates };
}

export function applyExcelMap(
  parsed: Pick<ExcelParseResult, "headers" | "rows">,
  map: ColumnMap,
  fileName: string,
  fallbackClass: EvidenceClass,
): IngestCandidate[] {
  return rowsToCandidates(parsed.headers, parsed.rows, map, {
    source: "xlsx",
    fileName,
    fallbackClass,
  });
}
