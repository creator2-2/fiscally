import { NextResponse } from "next/server";
import { extractErrorText, mapSmartBillHttpError } from "@/lib/smartbill/errors";
import { classifyKind, countsTowardIncome, parseSignedMoney } from "@/lib/smartbill/normalize";
import { readCreds, smartBillFetch, testConnection } from "@/lib/smartbill/server";
import type { ImportedInvoice } from "@/lib/smartbill/types";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "PARSE", message: "Cererea nu este JSON valid." },
      { status: 400 },
    );
  }

  const creds = readCreds(body);
  const year =
    body && typeof body === "object" && typeof (body as { year?: unknown }).year === "number"
      ? (body as { year: number }).year
      : new Date().getFullYear();

  if (!creds) {
    return NextResponse.json(
      {
        ok: false,
        code: "MISSING",
        message: "Completează emailul, tokenul API și CIF-ul (companyVatCode).",
      },
      { status: 400 },
    );
  }

  const connected = await testConnection(creds.email, creds.token, creds.companyVatCode);
  if (!connected.ok) {
    return NextResponse.json(connected, { status: 400 });
  }

  const cif = encodeURIComponent(creds.companyVatCode);
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const candidates = [
    `/invoice/list?cif=${cif}&startDate=${start}&endDate=${end}`,
    `/invoices?cif=${cif}&startDate=${start}&endDate=${end}`,
  ];

  for (const path of candidates) {
    const result = await smartBillFetch(path, creds.email, creds.token);
    if (result.status === 0) {
      return NextResponse.json({
        ok: false,
        code: "NETWORK",
        message: "Nu am putut contacta SmartBill pentru listarea facturilor.",
      });
    }
    if (result.status === 401 || result.status === 403) {
      return NextResponse.json(mapSmartBillHttpError(result.status, extractErrorText(result.json)));
    }
    if (result.status === 429) {
      return NextResponse.json(mapSmartBillHttpError(429, extractErrorText(result.json)));
    }
    if (result.status >= 200 && result.status < 300 && result.json) {
      const invoices = coerceInvoices(result.json);
      if (invoices.length > 0) {
        return NextResponse.json({
          ok: true,
          code: "OK",
          message: `Am importat ${invoices.length} documente din SmartBill pentru ${year}.`,
          data: { invoices, listUnsupported: false, series: connected.data?.series ?? [] },
        });
      }
    }
  }

  return NextResponse.json({
    ok: false,
    code: "LIST_UNSUPPORTED",
    message:
      "API-ul public SmartBill V1 poate verifica contul (serii / taxe), dar nu listează facturile pe an. Exportă un CSV din Cloud sau încarcă fișierul de mai jos.",
    data: {
      invoices: [],
      listUnsupported: true,
      series: connected.data?.series ?? [],
    },
  });
}

function coerceInvoices(payload: unknown): ImportedInvoice[] {
  const raw = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object"
      ? ((payload as { invoices?: unknown; list?: unknown; items?: unknown }).invoices ??
        (payload as { list?: unknown }).list ??
        (payload as { items?: unknown }).items)
      : [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Record<string, unknown>;
      const date = String(rec.date ?? rec.issueDate ?? rec.data ?? "");
      const total = parseSignedMoney(String(rec.total ?? rec.amount ?? rec.valoare ?? "0"));
      if (!date || !total) return null;
      const kind = classifyKind(String(rec.type ?? rec.tip ?? "factura"));
      const status = String(rec.status ?? rec.stare ?? "emisa");
      return {
        id: String(rec.id ?? `${rec.series ?? "SB"}-${rec.number ?? index}`),
        date: date.slice(0, 10),
        series: String(rec.series ?? rec.seriesName ?? ""),
        number: String(rec.number ?? rec.number ?? ""),
        client: String((rec.client as { name?: string } | undefined)?.name ?? rec.clientName ?? ""),
        clientCui: String((rec.client as { vatCode?: string } | undefined)?.vatCode ?? rec.clientCui ?? ""),
        total,
        vat: parseSignedMoney(String(rec.vat ?? rec.tva ?? "0")),
        currency: String(rec.currency ?? "RON"),
        kind,
        status,
        countsTowardIncome: countsTowardIncome(kind, status),
      } satisfies ImportedInvoice;
    })
    .filter((x): x is ImportedInvoice => Boolean(x));
}
