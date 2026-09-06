import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "examples");

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([
  ["data", "descriere", "valoare", "tip"],
  ["10.01.2026", "Consultanta demo Q1", 4500, "venit"],
  ["12.03.2026", "Caiet si pix (sintetic)", 32.5, "cheltuiala"],
  ["20.04.2026", "Workshop demo", 1800, "venit"],
]);
XLSX.utils.book_append_sheet(wb, ws, "Dovezi");
writeFileSync(join(dir, "dovezi-2026.xlsx"), XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));

writeFileSync(
  join(dir, "dovezi-demo.json"),
  `${JSON.stringify(
    [
      { data: "15.02.2026", descriere: "Servicii demo", suma: 1250 },
      { date: "2026-03-01", description: "Bon papetarie", amount: 48.9, tip: "cheltuiala" },
    ],
    null,
    2,
  )}\n`,
);

function pdfEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function makeTextPdf(lines: string[]): Buffer {
  const content =
    "BT\n/F1 14 Tf\n50 460 Td\n" +
    lines.map((line, i) => `${i === 0 ? "" : "0 -22 Td\n"}(${pdfEscape(line)}) Tj\n`).join("") +
    "ET\n";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 420 520] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefAt = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}

writeFileSync(
  join(dir, "factura-demo.pdf"),
  makeTextPdf([
    "FACTURA DEMO FISCALLY",
    "Client: Studio Exemplu SRL",
    "Data: 15.02.2026",
    "TOTAL 1.250,00 LEI",
    "Document sintetic. Fara date personale.",
  ]),
);

console.log("Wrote dovezi-2026.xlsx, dovezi-demo.json, factura-demo.pdf");
