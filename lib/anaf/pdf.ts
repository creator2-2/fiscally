import type { PrefillPackage } from "./prefill";

function pdfEscape(s: string): string {
  return ascii(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Helvetica is WinAnsi — fold Romanian diacritics so the PDF stays readable. */
export function ascii(s: string): string {
  return s
    .replace(/[ăâ]/g, "a")
    .replace(/[ĂÂ]/g, "A")
    .replace(/î/g, "i")
    .replace(/Î/g, "I")
    .replace(/[șş]/g, "s")
    .replace(/[ȘŞ]/g, "S")
    .replace(/[țţ]/g, "t")
    .replace(/[ȚŢ]/g, "T")
    .replace(/[^\x20-\x7E]/g, "?");
}

function wrap(text: string, width = 86): string[] {
  const words = ascii(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > width) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function pageContent(lines: string[]): string {
  const body = lines
    .map((line, i) => `${i === 0 ? "" : "0 -14 Td\n"}(${pdfEscape(line)}) Tj\n`)
    .join("");
  return `BT\n/F1 10 Tf\n48 790 Td\n${body}ET\n`;
}

export function buildPrefillPdf(pkg: PrefillPackage): Uint8Array {
  const header = [
    "FISCALLY — FISA DE PRECOMPLETARE D212",
    "NU este formularul oficial ANAF. NU inseamna depunere.",
    `${pkg.identity.fullName}  ·  ${pkg.identity.role}  ·  venituri ${pkg.identity.year}`,
    `Editie: ${pkg.form.order}  ·  ${pkg.form.status === "official" ? "oficiala" : "provizorie"}`,
    `Generat: ${pkg.generatedAt.slice(0, 19)}`,
    "",
  ];

  const fieldLines: string[] = [];
  let lastChapter = "";
  for (const f of pkg.fields) {
    if (f.chapterLabel !== lastChapter) {
      fieldLines.push("");
      fieldLines.push(ascii(f.chapterLabel).toUpperCase());
      lastChapter = f.chapterLabel;
    }
    fieldLines.push(`${f.label}: ${f.display}`);
    fieldLines.push(`  cheie ${f.anafKey}  ·  ${f.pdfHint}`);
  }

  const footer = [
    "",
    "CHECKLIST",
    ...pkg.checklist.map((c, i) => `${i + 1}. ${c}`),
    "",
    "SPV",
    ...pkg.spvSteps.map((c, i) => `${i + 1}. ${c}`),
    "",
    `Formular web: ${pkg.form.artifacts.find((a) => a.id === "web-duf")?.href ?? ""}`,
    pkg.disclaimer,
  ];

  const all = [...header, ...fieldLines, ...footer].flatMap((line) => wrap(line));
  const pages = chunk(all, 48);
  const contents = pages.map(pageContent);

  const objects: string[] = [];
  objects.push(`<< /Type /Catalog /Pages 2 0 R >>`);
  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  contents.forEach((content, i) => {
    const pageNum = 3 + i * 2;
    const contentNum = pageNum + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentNum} 0 R /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> >>`,
    );
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}endstream`);
  });
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);

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
  return new TextEncoder().encode(body);
}

export function downloadPrefillPdf(pkg: PrefillPackage) {
  const bytes = buildPrefillPdf(pkg);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fiscally-d212-precomplet-${pkg.identity.year}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
