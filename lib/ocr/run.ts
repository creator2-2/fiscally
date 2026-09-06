"use client";

import { parseReceiptText } from "./parse";
import type { OcrDraft } from "./types";

export interface OcrProgress {
  percent: number;
  status: string;
}

function statusRo(status: string): string {
  if (status.includes("loading") || status.includes("download")) return "Se încarcă motorul OCR…";
  if (status.includes("initializ")) return "Se pornește recunoașterea…";
  if (status.includes("recogniz")) return "Se citește textul…";
  return "Se procesează chitanța…";
}

function resizeForOcr(source: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement {
  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;
  const max = 1600;
  const scale = Math.min(1, max / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  return content.items
    .map((item) => ("str" in item ? item.str : ""))
    .join("\n");
}

async function renderPdfPage(file: File): Promise<HTMLCanvasElement> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponibil pentru PDF.");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

let workerPromise: Promise<import("tesseract.js").Worker> | null = null;

async function getWorker(onProgress?: (p: OcrProgress) => void) {
  if (!workerPromise) {
    const { createWorker } = await import("tesseract.js");
    workerPromise = createWorker("eng", 1, {
      logger: (m) => {
        if (typeof m.progress === "number") {
          onProgress?.({ percent: Math.round(m.progress * 100), status: statusRo(String(m.status ?? "")) });
        }
      },
    });
  }
  return workerPromise;
}

export async function recognizeFile(
  file: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<OcrDraft> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  let previewUrl = "";
  let text = "";
  let engineConfidence = 0.4;
  let source: OcrDraft["source"] = "ocr";

  if (isPdf) {
    onProgress?.({ percent: 15, status: "Se citește PDF-ul…" });
    const pdfText = await extractPdfText(file);
    const compact = pdfText.replace(/\s/g, "");
    if (compact.length >= 40) {
      text = pdfText;
      engineConfidence = 0.72;
      source = "pdf-text";
      const canvas = await renderPdfPage(file);
      previewUrl = canvas.toDataURL("image/jpeg", 0.72);
    } else {
      const canvas = await renderPdfPage(file);
      previewUrl = canvas.toDataURL("image/jpeg", 0.72);
      onProgress?.({ percent: 30, status: "Se citește textul din pagină…" });
      const worker = await getWorker(onProgress);
      const result = await worker.recognize(canvas);
      text = result.data.text;
      engineConfidence = (result.data.confidence ?? 0) / 100;
    }
  } else {
    previewUrl = URL.createObjectURL(file);
    const img = await blobToImage(file);
    const canvas = resizeForOcr(img);
    onProgress?.({ percent: 20, status: "Se citește textul din poză…" });
    const worker = await getWorker(onProgress);
    const result = await worker.recognize(canvas);
    text = result.data.text;
    engineConfidence = (result.data.confidence ?? 0) / 100;
  }

  const parsed = parseReceiptText(text);
  if (!text.trim()) {
    throw new Error("Nu am găsit text pe acest document. Încearcă o poză mai clară sau completează manual.");
  }

  const confidence = Math.min(0.93, parsed.confidence * 0.65 + engineConfidence * 0.35);
  return {
    label: file.name,
    amount: parsed.amount ?? 0,
    date: parsed.date,
    merchant: parsed.merchant,
    confidence,
    classification: "pfa-expense",
    rawText: text,
    previewUrl,
    source,
  };
}
