import { extractErrorText, mapSmartBillHttpError } from "./errors";
import { normalizeCif } from "./normalize";
import type { SeriesInfo, SmartBillApiResult } from "./types";

export const SMARTBILL_BASE =
  process.env.SMARTBILL_BASE_URL?.replace(/\/$/, "") || "https://ws.smartbill.ro/SBORO/api";

const MIN_INTERVAL_MS = 350;
let lastCallAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function basicAuth(email: string, token: string): string {
  return `Basic ${Buffer.from(`${email}:${token}`, "utf8").toString("base64")}`;
}

export async function smartBillFetch(
  path: string,
  email: string,
  token: string,
): Promise<{ status: number; json: unknown; text: string }> {
  const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastCallAt));
  if (wait) await sleep(wait);
  lastCallAt = Date.now();

  const url = path.startsWith("http") ? path : `${SMARTBILL_BASE}${path}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: basicAuth(email, token),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    let json: unknown = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }
    return { status: res.status, json, text };
  } catch {
    return { status: 0, json: null, text: "" };
  }
}

export function readCreds(body: unknown): { email: string; token: string; companyVatCode: string } | null {
  if (!body || typeof body !== "object") return null;
  const rec = body as Record<string, unknown>;
  const email = typeof rec.email === "string" ? rec.email.trim() : "";
  const token = typeof rec.token === "string" ? rec.token.trim() : "";
  const companyVatCode = typeof rec.companyVatCode === "string" ? normalizeCif(rec.companyVatCode) : "";
  if (!email || !token || !companyVatCode) return null;
  return { email, token, companyVatCode };
}

export async function testConnection(
  email: string,
  token: string,
  companyVatCode: string,
): Promise<SmartBillApiResult<{ series: SeriesInfo[] }>> {
  const cif = encodeURIComponent(companyVatCode);
  const result = await smartBillFetch(`/series?cif=${cif}`, email, token);
  if (result.status === 0) {
    return {
      ok: false,
      code: "NETWORK",
      message: "Nu am putut contacta SmartBill. Verifică rețeaua și încearcă din nou.",
    };
  }
  if (result.status >= 400) {
    return mapSmartBillHttpError(result.status, extractErrorText(result.json) || result.text);
  }
  const series = parseSeries(result.json);
  return {
    ok: true,
    code: "OK",
    message: series.length
      ? `Conexiune reușită. Am găsit ${series.length} serii de documente.`
      : "Conexiune reușită. Contul răspunde, dar nu am găsit serii configurate.",
    data: { series },
  };
}

export function parseSeries(payload: unknown): SeriesInfo[] {
  if (!payload) return [];
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { list?: unknown }).list)
      ? ((payload as { list: unknown[] }).list)
      : payload && typeof payload === "object" && Array.isArray((payload as { series?: unknown }).series)
        ? ((payload as { series: unknown[] }).series)
        : [];
  const series: SeriesInfo[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const name = String(rec.name ?? rec.seriesName ?? rec.serie ?? "");
    if (!name) continue;
    series.push({
      name,
      type: rec.type ? String(rec.type) : undefined,
      nextNumber: rec.nextNumber != null ? String(rec.nextNumber) : undefined,
    });
  }
  return series;
}
