export interface AmountCandidate {
  amount: number;
  raw: string;
  score: number;
}

export interface ParsedReceipt {
  amount: number | null;
  amountConfidence: number;
  date: string | null;
  dateConfidence: number;
  merchant: string;
  merchantConfidence: number;
  candidates: AmountCandidate[];
  confidence: number;
}

const TOTAL_HINT =
  /\b(total|suma|achitat|plata|de\s*plat[aă]|rest de plata|de plata)\b/i;
const CURRENCY = /\b(lei|ron|r\.?o\.?n\.?)\b/i;
const SKIP_MERCHANT =
  /^(chitanta|chitanță|bon fiscal|factura|factură|cif\b|cui\b|tva\b|data\b|total\b|document sintetic)/i;

function normalizeOcr(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[|]/g, " ")
    .replace(/\bT0TAL\b/gi, "TOTAL")
    .replace(/\bTOTA[LI]\b/gi, "TOTAL")
    .replace(/\bLE1\b/gi, "LEI")
    .replace(/[–—]/g, "-");
}

/** Romanian 1.234,56 / 1234,56 / 32.50 → number */
export function parseRoAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(/[^\d,.-]/g, "");
  if (!cleaned) return null;
  let normalized = cleaned;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    const [, frac = ""] = cleaned.split(",");
    if (frac.length === 2 || frac.length === 1) {
      normalized = cleaned.replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, "");
  }
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0 || n > 10_000_000) return null;
  return Math.round(n * 100) / 100;
}

export function parseRoDate(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000 || year > 2100) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function scoreAmount(raw: string, amount: number, line: string, indexFromEnd: number): number {
  let score = 1;
  if (TOTAL_HINT.test(line)) score += 4;
  if (CURRENCY.test(line) || CURRENCY.test(raw)) score += 1.5;
  if (indexFromEnd <= 2) score += 1;
  if (amount >= 1 && /,\d{2}|\.\d{2}/.test(raw)) score += 1;
  if (amount > 200000) score -= 1;
  return score;
}

const AMOUNT_TOKEN =
  /(?:(?:TOTAL|SUMA|ACHITAT|PLATA|DE\s*PLATA)\s*[:\-]?\s*)?(\d{1,3}(?:[.\s]\d{3})+,\d{2}|\d+,\d{2}|\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d+\.\d{2}(?!\d)|\d+)(?=\s*(?:LEI|RON|R\.?O\.?N\.?)?\b|$)/gi;

export function extractAmounts(text: string): AmountCandidate[] {
  const lines = normalizeOcr(text)
    .replace(/\b\d{1,2}[./-]\d{1,2}[./-]\d{4}\b/g, " ")
    .split(/\n+/);
  const found: AmountCandidate[] = [];
  lines.forEach((line, i) => {
    const indexFromEnd = lines.length - 1 - i;
    const matches = line.matchAll(AMOUNT_TOKEN);
    for (const match of matches) {
      const raw = match[1] ?? match[0];
      if (/^\d{4}$/.test(raw) && Number(raw) >= 2000 && Number(raw) <= 2100) continue;
      const amount = parseRoAmount(raw);
      if (amount == null) continue;
      if (amount < 0.5) continue;
      found.push({
        amount,
        raw,
        score: scoreAmount(raw, amount, line, indexFromEnd),
      });
    }
  });
  return found.sort((a, b) => b.score - a.score || b.amount - a.amount);
}

export function extractDate(text: string): { date: string | null; confidence: number } {
  const normalized = normalizeOcr(text);
  const matches = normalized.match(/\b(\d{1,2}[./-]\d{1,2}[./-]\d{4})\b/g) ?? [];
  for (const raw of matches) {
    const date = parseRoDate(raw);
    if (date) {
      const nearLabel = /data|din/i.test(normalized);
      return { date, confidence: nearLabel ? 0.85 : 0.7 };
    }
  }
  return { date: null, confidence: 0 };
}

export function extractMerchant(text: string): { merchant: string; confidence: number } {
  const lines = normalizeOcr(text)
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  for (const line of lines) {
    if (SKIP_MERCHANT.test(line)) continue;
    if (TOTAL_HINT.test(line) || CURRENCY.test(line)) continue;
    if (/^\d/.test(line)) continue;
    const letters = (line.match(/[A-Za-zĂÂÎȘȚăâîșț]/g) ?? []).length;
    if (letters < 4) continue;
    if (line.length > 60) continue;
    return { merchant: line.slice(0, 80), confidence: 0.55 };
  }
  return { merchant: "", confidence: 0 };
}

export function parseReceiptText(text: string): ParsedReceipt {
  const candidates = extractAmounts(text);
  const best = candidates[0] ?? null;
  const second = candidates[1] ?? null;
  let amountConfidence = 0;
  if (best) {
    amountConfidence = Math.min(0.92, 0.4 + best.score * 0.1);
    if (second && Math.abs(second.amount - best.amount) > 0.05 && second.score >= best.score - 0.5) {
      amountConfidence = Math.min(amountConfidence, 0.55);
    }
    if (best.score < 3) amountConfidence = Math.min(amountConfidence, 0.5);
  }
  const { date, confidence: dateConfidence } = extractDate(text);
  const { merchant, confidence: merchantConfidence } = extractMerchant(text);
  const confidence = best
    ? Math.min(
        0.93,
        amountConfidence * 0.7 + (date ? dateConfidence * 0.15 : 0) + (merchant ? merchantConfidence * 0.15 : 0.05),
      )
    : 0.15;
  return {
    amount: best?.amount ?? null,
    amountConfidence,
    date,
    dateConfidence,
    merchant,
    merchantConfidence,
    candidates: candidates.slice(0, 5),
    confidence,
  };
}

export function confidenceLabel(confidence: number): { text: string; tone: "good" | "check" | "low" } {
  if (confidence >= 0.75) return { text: "încredere bună — verifică totuși", tone: "good" };
  if (confidence >= 0.45) return { text: "verifică cifrele", tone: "check" };
  return { text: "nesigur — completează manual", tone: "low" };
}
