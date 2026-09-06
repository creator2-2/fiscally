import type { FilerRole } from "./du-flow";

export type ActivityType = "servicii" | "it" | "liberal";
export type CasBaseChoice = "12" | "24";
export type InvoiceKind = "factura" | "proforma";
export type Plan = "free" | "paid";

export interface Profile {
  fullName: string;
  tradeName: string;
  cui: string;
  cnp: string;
  filerRole: FilerRole | null;
  email: string;
  phone: string;
  county: string;
  city: string;
  address: string;
  activity: ActivityType;
  caen: string;
  activityDescription: string;
  fiscalYear: number;
  income: number;
  expenses: number;
  pfRentalIncome: number;
  pfOtherIncome: number;
  pfOtherExpenses: number;
  tvaPayer: boolean;
  tvaCollected: number;
  tvaDeductible: number;
  alsoEmployee: boolean;
  casOptional: boolean;
  casBaseChoice: CasBaseChoice;
  clientName: string;
  clientCui: string;
  clientAddress: string;
  invoiceSeries: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceDescription: string;
  invoiceAmount: number;
  invoiceKind: InvoiceKind;
  contractDuration: string;
  contractValue: number;
}

export interface Subscription {
  plan: Plan;
  upgradedAt: string | null;
}

export interface TaxLine {
  id: string;
  label: string;
  detail: string;
  amount: number;
  optional?: boolean;
}

export interface TaxEstimate {
  year: number;
  configLabel: string;
  income: number;
  expenses: number;
  netBeforeContributions: number;
  cas: number;
  casBase: number;
  casMandatory: boolean;
  casOptionalApplied: boolean;
  cass: number;
  cassBase: number;
  cassNote: string;
  taxableIncome: number;
  incomeTax: number;
  totalSocialAndTax: number;
  netAfterTax: number;
  effectiveRate: number;
  tvaDue: number | null;
  lines: TaxLine[];
  assumptions: string[];
}

export type DeadlineStatus = "upcoming" | "soon" | "overdue" | "done-hint";

export interface Deadline {
  id: string;
  title: string;
  description: string;
  date: string;
  category: "declaratie" | "plata" | "tva" | "lunar" | "setup";
  status: DeadlineStatus;
  href?: string;
}

export type DocumentId =
  | "situatie-fiscala"
  | "declaratie-unica"
  | "pachet-contabil"
  | "dosar-efactura"
  | "contract-servicii"
  | "factura-draft";

export interface DocumentMeta {
  id: DocumentId;
  title: string;
  subtitle: string;
  pack: string;
  freePreview: boolean;
  priority: number;
}

export const COUNTIES = [
  "Alba",
  "Arad",
  "Argeș",
  "Bacău",
  "Bihor",
  "Bistrița-Năsăud",
  "Botoșani",
  "Brașov",
  "Brăila",
  "București",
  "Buzău",
  "Caraș-Severin",
  "Călărași",
  "Cluj",
  "Constanța",
  "Covasna",
  "Dâmbovița",
  "Dolj",
  "Galați",
  "Giurgiu",
  "Gorj",
  "Harghita",
  "Hunedoara",
  "Ialomița",
  "Iași",
  "Ilfov",
  "Maramureș",
  "Mehedinți",
  "Mureș",
  "Neamț",
  "Olt",
  "Prahova",
  "Satu Mare",
  "Sălaj",
  "Sibiu",
  "Suceava",
  "Teleorman",
  "Timiș",
  "Tulcea",
  "Vaslui",
  "Vâlcea",
  "Vrancea",
] as const;

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  servicii: "Servicii",
  it: "IT / dezvoltare",
  liberal: "Profesie liberală",
};

export const CAEN_HINTS: Record<ActivityType, { code: string; label: string }> = {
  it: { code: "6201", label: "Activități de realizare a soft-ului" },
  servicii: { code: "7022", label: "Activități de consultanță pentru afaceri" },
  liberal: { code: "6920", label: "Activități de contabilitate / audit / consultanță fiscală" },
};

export const defaultProfile: Profile = {
  fullName: "",
  tradeName: "",
  cui: "",
  cnp: "",
  filerRole: null,
  email: "",
  phone: "",
  county: "București",
  city: "",
  address: "",
  activity: "it",
  caen: "6201",
  activityDescription: "",
  fiscalYear: 2026,
  income: 0,
  expenses: 0,
  pfRentalIncome: 0,
  pfOtherIncome: 0,
  pfOtherExpenses: 0,
  tvaPayer: false,
  tvaCollected: 0,
  tvaDeductible: 0,
  alsoEmployee: false,
  casOptional: false,
  casBaseChoice: "12",
  clientName: "",
  clientCui: "",
  clientAddress: "",
  invoiceSeries: "FSC",
  invoiceNumber: "001",
  invoiceDate: "",
  invoiceDescription: "Prestări servicii conform contract",
  invoiceAmount: 0,
  invoiceKind: "proforma",
  contractDuration: "12 luni",
  contractValue: 0,
};

export const PRICE_LEI = 39;
