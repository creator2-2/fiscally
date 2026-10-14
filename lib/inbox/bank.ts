import { parseRoAmount, parseRoDate } from "../ocr/parse";
import { parseDelimited } from "./tabular";
import type { EvidenceClass, IngestCandidate } from "./types";

/**
 * Bank-statement convention used by Romanian exports (BT, ING, BCR, Raiffeisen):
 * Credit is money in, Debit is money out. Revolut-style files use a signed Amount
 * plus Balance. Parsing stays on device; nothing here talks to a bank.
 */

const DATE_PRIORITY = [
  "datatranzactie",
  "datatranzactiei",
  "transactiondate",
  "bookingdate",
  "completeddate",
  "datafinalizarii",
  "dataoperatiunii",
  "dataoperatiune",
  "starteddate",
  "data",
  "date",
  "dataprelucrarii",
  "datavaluta",
  "datavalutei",
  "valuedate",
];

const DESC_PRIORITY = [
  "descriere",
  "detaliitranzactie",
  "detaliitranzactiei",
  "description",
  "explicatii",
  "narrative",
  "details",
  "detalii",
  "beneficiar",
  "numebeneficiar",
  "operatiune",
  "denumire",
];

const DEBIT_NAMES = [
  "debit",
  "sumadebit",
  "sumaiesita",
  "iesiri",
  "plati",
  "moneyout",
  "outflow",
  "rulajdebitor",
];

const CREDIT_NAMES = [
  "credit",
  "sumacredit",
  "sumaintrata",
  "intrari",
  "incasari",
  "incasare",
  "moneyin",
  "inflow",
  "rulajcreditor",
];

const AMOUNT_NAMES = ["suma", "amount", "valoare", "transactionamount", "sumatranzactie", "sumaoperatiune"];

const BALANCE_NAMES = ["sold", "balance", "soldfinal", "soldintermediar", "soldcont", "runningbalance"];

const CURRENCY_NAMES = ["moneda", "currency", "ccy", "valuta"];

const TYPE_NAMES = ["tiptranzactie", "transactiontype", "tipoperatiune", "type", "tip"];

const FEE_NAMES = ["fee", "comision", "comisionbancar", "comisiontranzactie"];

const STATE_NAMES = ["stare", "state", "status", "transactionstate"];

const OWN_ACCOUNT =
  /transfer\s+intre\s+cont|cont(?:ul)?\s+propriu|virament\s+propriu|cont de economii|\beconomii\b|\bsavings\b|own account|to savings|from savings/;

const RENT = /\bchirie\b|\bchirii\b|\brent\b/;

const NON_FINAL = /pending|reverted|failed|declined|anulat|respins|refuzat/i;

export interface BankParseResult {
  candidates: IngestCandidate[];
  headers: string[];
  rows: string[][];
}

export function normHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Signed Romanian or dot-decimal amount. Empty debit/credit cells are 0. */
export function parseSignedRoAmount(raw: string): number | null {
  let s = raw.trim().replace(/\u00a0/g, "").replace(/\s/g, "");
  if (!s || s === "-" || s === "—" || s === "–") return 0;
  let sign = 1;
  if (s.startsWith("(") && s.endsWith(")")) {
    sign = -1;
    s = s.slice(1, -1);
  }
  if (s.startsWith("+")) s = s.slice(1);
  else if (s.startsWith("-")) {
    sign = -1;
    s = s.slice(1);
  }
  s = s.replace(/lei|ron/gi, "");
  if (!s || /^0+([.,]0+)?$/.test(s)) return 0;
  const n = parseRoAmount(s);
  if (n == null) return null;
  return sign * n;
}

export function parseBankDate(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return parseRoDate(v.split(/\s+/)[0] ?? v);
}

function pick(headers: string[], names: string[]): number | null {
  for (const name of names) {
    const index = headers.indexOf(name);
    if (index >= 0) return index;
  }
  return null;
}

interface BankColumns {
  headerIndex: number;
  headers: string[];
  date: number;
  description: number | null;
  debit: number | null;
  credit: number | null;
  amount: number | null;
  balance: number | null;
  currency: number | null;
  type: number | null;
  fee: number | null;
  state: number | null;
  split: boolean;
}

function findBankHeader(matrix: string[][]): BankColumns | null {
  const limit = Math.min(matrix.length, 40);
  for (let i = 0; i < limit; i += 1) {
    const original = matrix[i];
    const headers = original.map(normHeader);
    if (headers.filter(Boolean).length < 3) continue;
    const date = pick(headers, DATE_PRIORITY);
    if (date == null) continue;
    const debit = pick(headers, DEBIT_NAMES);
    const credit = pick(headers, CREDIT_NAMES);
    const balance = pick(headers, BALANCE_NAMES);
    let amount = pick(headers, AMOUNT_NAMES);
    if (amount != null && (amount === debit || amount === credit || amount === balance)) amount = null;
    const split = debit != null && credit != null;
    const signed = amount != null && balance != null && !split;
    if (!split && !signed) continue;
    return {
      headerIndex: i,
      headers: original,
      date,
      description: pick(headers, DESC_PRIORITY),
      debit,
      credit,
      amount: split ? null : amount,
      balance,
      currency: pick(headers, CURRENCY_NAMES),
      type: pick(headers, TYPE_NAMES),
      fee: pick(headers, FEE_NAMES),
      state: pick(headers, STATE_NAMES),
      split,
    };
  }
  return null;
}

function cell(row: string[], index: number | null): string {
  if (index == null) return "";
  return String(row[index] ?? "").trim();
}

function roundMoney(n: number): number {
  return Math.round(Math.abs(n) * 100) / 100;
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function classifyMovement(
  direction: "in" | "out",
  description: string,
  typeRaw: string,
  fallbackIncome: EvidenceClass,
): { classification: EvidenceClass; hint?: string; confidence: number } {
  const blob = fold(`${description} ${typeRaw}`);
  if (OWN_ACCOUNT.test(blob)) {
    return {
      classification: "ignore",
      hint: "Pare transfer între conturi proprii. Lasă pe Ignoră dacă nu e venit sau cheltuială.",
      confidence: 0.62,
    };
  }
  if (direction === "in" && RENT.test(blob)) {
    return {
      classification: "pf-income",
      hint: "Menționează chirie. Verifică dacă e venit de persoană fizică.",
      confidence: 0.74,
    };
  }
  if (direction === "in") {
    return { classification: fallbackIncome, confidence: 0.84 };
  }
  if (fallbackIncome === "pf-income") {
    return {
      classification: "ignore",
      hint: "Ieșire din cont. Pentru persoană fizică nu o pun automat la cheltuieli.",
      confidence: 0.7,
    };
  }
  return { classification: "pfa-expense", confidence: 0.84 };
}

function ronCurrency(raw: string): boolean {
  const v = raw.trim().toUpperCase();
  return !v || v === "RON" || v === "LEI" || v === "R.O.N.";
}

export function parseBankMatrix(
  matrix: string[][],
  fileName: string,
  fallbackIncome: EvidenceClass,
  year?: number,
): BankParseResult | null {
  const found = findBankHeader(matrix);
  if (!found) return null;
  const dataRows = matrix.slice(found.headerIndex + 1);
  const candidates: IngestCandidate[] = [];

  dataRows.forEach((row, index) => {
    const dateRaw = cell(row, found.date);
    if (normHeader(dateRaw) === normHeader(cell(found.headers, found.date))) return;
    const date = parseBankDate(dateRaw);
    const typeRaw = cell(row, found.type);
    const description =
      cell(row, found.description) || typeRaw || `${fileName} · rând ${index + 1}`;
    if (/^(total|sold final|rulaj)\b/i.test(description) && !date) return;

    let inflow = 0;
    let outflow = 0;
    let unreadable = false;
    if (found.split && found.debit != null && found.credit != null) {
      const debit = parseSignedRoAmount(cell(row, found.debit));
      const credit = parseSignedRoAmount(cell(row, found.credit));
      if (debit == null || credit == null) unreadable = true;
      else {
        const net = Math.abs(credit) - Math.abs(debit);
        if (net > 0) inflow = net;
        else if (net < 0) outflow = -net;
      }
    } else if (found.amount != null) {
      const signed = parseSignedRoAmount(cell(row, found.amount));
      if (signed == null) unreadable = true;
      else if (signed > 0) inflow = signed;
      else if (signed < 0) outflow = -signed;
    }

    const feeRaw = cell(row, found.fee);
    const feeParsed = feeRaw ? parseSignedRoAmount(feeRaw) : 0;
    const fee = feeParsed == null ? 0 : roundMoney(feeParsed);
    if (!inflow && !outflow && !fee) return;

    const currency = cell(row, found.currency);
    const state = cell(row, found.state);
    const foreign = !ronCurrency(currency);
    const pending = Boolean(state) && NON_FINAL.test(state);
    const outside = Boolean(year && date && !date.startsWith(String(year)));

    const push = (direction: "in" | "out", amount: number, label: string, suffix: string) => {
      const base = classifyMovement(direction, description, typeRaw, fallbackIncome);
      let classification = base.classification;
      let hint = base.hint;
      if (pending) {
        classification = "ignore";
        hint = `Stare ${state}. Nu e o tranzacție finală.`;
      } else if (foreign) {
        classification = "ignore";
        hint = `Monedă ${currency.toUpperCase()}. Intră în calcul doar RON.`;
      } else if (outside) {
        classification = "ignore";
        hint = `În afara anului fiscal ${year}.`;
      }
      candidates.push({
        id: `bank-${fileName}-${index}${suffix}`,
        source: "bank",
        fileName,
        amount: roundMoney(amount),
        date,
        description: label,
        classification,
        confidence: base.confidence,
        hint,
        rawText: row.join(" | "),
        error: unreadable ? "Nu am citit suma. Completează manual." : undefined,
      });
    };

    if (unreadable) {
      push("in", 0, description, "");
      return;
    }
    if (inflow) push("in", inflow, description, "");
    if (outflow) push("out", outflow, description, "");
    if (fee > 0) push("out", fee, `Comision · ${description}`, "-fee");
  });

  if (!candidates.length) {
    return {
      headers: found.headers,
      rows: dataRows,
      candidates: [
        {
          id: `bank-empty-${fileName}`,
          source: "bank",
          fileName,
          amount: 0,
          date: null,
          description: fileName,
          classification: "ignore",
          confidence: 0,
          error: "Extrasul nu are tranzacții recunoscute.",
        },
      ],
    };
  }

  return { headers: found.headers, rows: dataRows, candidates };
}

export function parseBankStatement(
  text: string,
  fileName: string,
  fallbackIncome: EvidenceClass,
  year?: number,
): BankParseResult | null {
  return parseBankMatrix(parseDelimited(text), fileName, fallbackIncome, year);
}
