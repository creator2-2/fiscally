import { computeEstimate } from "./tax-engine";
import type { ImportSummary } from "./smartbill/types";
import type { CasBaseChoice, Profile, TaxEstimate } from "./types";

export type FieldSource = "imported" | "manual" | "estimated" | "wizard";

export interface SourcedField {
  value: number;
  source: FieldSource;
  note: string;
}

export interface D212Identity {
  fullName: string;
  tradeName: string;
  cui: string;
  county: string;
  city: string;
  address: string;
  email: string;
  activity: Profile["activity"];
  caen: string;
}

export interface D212Draft {
  year: number;
  identity: D212Identity;
  income: SourcedField;
  expenses: SourcedField;
  tvaPayer: boolean;
  tvaCollected: SourcedField;
  tvaDeductible: SourcedField;
  alsoEmployee: boolean;
  casOptional: boolean;
  casBaseChoice: CasBaseChoice;
  importSummary: ImportSummary | null;
  savedAt: string | null;
}

export function emptyD212(profile: Profile, year = profile.fiscalYear): D212Draft {
  return {
    year,
    identity: {
      fullName: profile.fullName,
      tradeName: profile.tradeName,
      cui: profile.cui,
      county: profile.county,
      city: profile.city,
      address: profile.address,
      email: profile.email,
      activity: profile.activity,
      caen: profile.caen,
    },
    income: {
      value: profile.income,
      source: "wizard",
      note: "Din asistentul Fiscally",
    },
    expenses: {
      value: profile.expenses,
      source: "wizard",
      note: "SmartBill nu exportă cheltuielile PFA. Păstrăm valoarea din asistent.",
    },
    tvaPayer: profile.tvaPayer,
    tvaCollected: {
      value: profile.tvaCollected,
      source: profile.tvaPayer ? "wizard" : "manual",
      note: "TVA evidențiat separat",
    },
    tvaDeductible: {
      value: profile.tvaDeductible,
      source: "wizard",
      note: "Nu vine din facturile emise",
    },
    alsoEmployee: profile.alsoEmployee,
    casOptional: profile.casOptional,
    casBaseChoice: profile.casBaseChoice,
    importSummary: null,
    savedAt: null,
  };
}

export function mapImportToD212(
  profile: Profile,
  summary: ImportSummary,
  previous?: D212Draft | null,
): D212Draft {
  const base = previous ?? emptyD212(profile, summary.year);
  const vatImported = summary.totalVat > 0;
  return {
    ...base,
    year: summary.year,
    identity: {
      ...base.identity,
      cui: profile.cui || base.identity.cui,
    },
    income: {
      value: summary.totalIncome,
      source: "imported",
      note:
        summary.source === "csv"
          ? `Import CSV · ${summary.includedCount} documente care contează la venit`
          : `Import SmartBill · ${summary.includedCount} documente care contează la venit`,
    },
    expenses: {
      value: base.expenses.value,
      source: base.expenses.source === "imported" ? "manual" : base.expenses.source,
      note: "Cheltuielile rămân manuale — SmartBill nu le trimite pe API-ul public.",
    },
    tvaPayer: vatImported ? true : base.tvaPayer,
    tvaCollected: vatImported
      ? {
          value: summary.totalVat,
          source: "imported",
          note: "Suma TVA din facturile importate",
        }
      : base.tvaCollected,
    importSummary: summary,
    savedAt: null,
  };
}

export function draftToProfile(profile: Profile, draft: D212Draft): Profile {
  return {
    ...profile,
    fullName: draft.identity.fullName || profile.fullName,
    tradeName: draft.identity.tradeName,
    cui: draft.identity.cui || profile.cui,
    county: draft.identity.county,
    city: draft.identity.city,
    address: draft.identity.address,
    email: draft.identity.email || profile.email,
    activity: draft.identity.activity,
    caen: draft.identity.caen,
    fiscalYear: draft.year,
    income: draft.income.value,
    expenses: draft.expenses.value,
    tvaPayer: draft.tvaPayer,
    tvaCollected: draft.tvaCollected.value,
    tvaDeductible: draft.tvaDeductible.value,
    alsoEmployee: draft.alsoEmployee,
    casOptional: draft.casOptional,
    casBaseChoice: draft.casBaseChoice,
  };
}

export function estimateFromDraft(profile: Profile, draft: D212Draft): TaxEstimate {
  return computeEstimate(draftToProfile(profile, draft));
}

export function sourceLabel(source: FieldSource): string {
  switch (source) {
    case "imported":
      return "Importat";
    case "estimated":
      return "Estimat";
    case "wizard":
      return "Din asistent";
    default:
      return "Editat manual";
  }
}
