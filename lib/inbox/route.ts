import type { FileRoute } from "./types";

const MAX_BYTES = 8 * 1024 * 1024;

export function routeFile(file: File): FileRoute {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("image/") || /\.(jpe?g|png|webp)$/.test(name)) return "image";
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (type.includes("csv") || name.endsWith(".csv")) return "csv";
  if (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    type.includes("spreadsheet") ||
    type.includes("excel")
  ) {
    return "xlsx";
  }
  if (type.includes("json") || name.endsWith(".json")) return "json";
  if (type.startsWith("text/") || name.endsWith(".txt")) return "txt";
  return "unknown";
}

export function assertFileSize(file: File): void {
  if (file.size > MAX_BYTES) {
    throw new Error(`„${file.name}” e prea mare (max. 8 MB).`);
  }
}

export function routeErrorMessage(file: File): string {
  return `Nu recunosc tipul „${file.name}”. Încearcă CSV, Excel, PDF, poză, JSON sau text — sau completează linia manual.`;
}
