export type InvoiceKindImported = "factura" | "proforma" | "storno" | "alta";

export interface SmartBillCredentials {
  email: string;
  token: string;
  companyVatCode: string;
  lastVerifiedAt: string | null;
}

export interface ImportedInvoice {
  id: string;
  date: string;
  series: string;
  number: string;
  client: string;
  clientCui: string;
  total: number;
  vat: number;
  currency: string;
  kind: InvoiceKindImported;
  status: string;
  countsTowardIncome: boolean;
}

export interface MonthBucket {
  month: number;
  label: string;
  count: number;
  total: number;
  vat: number;
}

export interface ImportSummary {
  source: "smartbill" | "csv";
  year: number;
  invoiceCount: number;
  includedCount: number;
  skippedCount: number;
  totalIncome: number;
  totalVat: number;
  months: MonthBucket[];
  invoices: ImportedInvoice[];
  importedAt: string;
  note: string;
}

export interface SmartBillApiResult<T> {
  ok: boolean;
  code:
    | "OK"
    | "MISSING"
    | "AUTH"
    | "PLAN"
    | "CIF"
    | "RATE"
    | "NETWORK"
    | "LIST_UNSUPPORTED"
    | "PARSE"
    | "UNKNOWN";
  message: string;
  data?: T;
}

export interface SeriesInfo {
  name: string;
  type?: string;
  nextNumber?: string;
}
