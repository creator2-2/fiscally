import type { SmartBillApiResult, SmartBillCredentials } from "./types";

async function post<T>(path: string, creds: SmartBillCredentials, extra?: Record<string, unknown>) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: creds.email,
      token: creds.token,
      companyVatCode: creds.companyVatCode,
      ...extra,
    }),
  });
  const json = (await res.json()) as SmartBillApiResult<T>;
  return json;
}

export function connectSmartBill(creds: SmartBillCredentials) {
  return post<{ series: { name: string; type?: string }[] }>("/api/smartbill/connect", creds);
}

export function importSmartBillInvoices(creds: SmartBillCredentials, year: number) {
  return post<{ invoices: unknown[]; listUnsupported?: boolean; series?: { name: string }[] }>(
    "/api/smartbill/invoices",
    creds,
    { year },
  );
}
