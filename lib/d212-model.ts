import type { DuFlowState, FilerRole } from "./du-flow";
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
  cnp: string;
  county: string;
  city: string;
  address: string;
  email: string;
  activity: Profile["activity"];
  caen: string;
  filerRole: FilerRole | null;
}

export interface D212Draft {
  year: number;
  identity: D212Identity;
  income: SourcedField;
  expenses: SourcedField;
  pfRentalIncome: SourcedField;
  pfOtherIncome: SourcedField;
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
      cnp: profile.cnp,
      county: profile.county,
      city: profile.city,
      address: profile.address,
      email: profile.email,
      activity: profile.activity,
      caen: profile.caen,
      filerRole: profile.filerRole,
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
    pfRentalIncome: {
      value: profile.pfRentalIncome,
      source: "manual",
      note: "Venituri din chirii (PF) — ipoteză 20% forfetar",
    },
    pfOtherIncome: {
      value: profile.pfOtherIncome,
      source: "manual",
      note: "Alte venituri PF",
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
    cnp: draft.identity.cnp || profile.cnp,
    filerRole: draft.identity.filerRole,
    county: draft.identity.county,
    city: draft.identity.city,
    address: draft.identity.address,
    email: draft.identity.email || profile.email,
    activity: draft.identity.activity,
    caen: draft.identity.caen,
    fiscalYear: draft.year,
    income: draft.income.value,
    expenses: draft.expenses.value,
    pfRentalIncome: draft.pfRentalIncome.value,
    pfOtherIncome: draft.pfOtherIncome.value,
    tvaPayer: draft.tvaPayer,
    tvaCollected: draft.tvaCollected.value,
    tvaDeductible: draft.tvaDeductible.value,
    alsoEmployee: draft.alsoEmployee,
    casOptional: draft.casOptional,
    casBaseChoice: draft.casBaseChoice,
  };
}

export function flowToD212(profile: Profile, flow: DuFlowState, previous?: D212Draft | null): D212Draft {
  const base = previous ?? emptyD212(profile, flow.year);
  const imported = flow.evidence.some((e) => e.kind === "csv" || e.kind === "smartbill");
  return {
    ...base,
    year: flow.year,
    identity: {
      ...base.identity,
      fullName: flow.fullName || base.identity.fullName,
      cui: flow.cui || base.identity.cui,
      cnp: flow.cnp || base.identity.cnp,
      email: flow.email || base.identity.email,
      activity: flow.pfaActivity,
      filerRole: flow.role,
    },
    income: {
      value: flow.pfaIncome,
      source:
        imported || flow.evidence.some((e) => e.classification === "pfa-income")
          ? "imported"
          : flow.pfaIncome
            ? "manual"
            : "wizard",
      note: imported
        ? "Din dovezile importate în Pregătește DU"
        : flow.evidence.some((e) => e.classification === "pfa-income")
          ? "Din liniile confirmate în inbox"
          : "Din fluxul Pregătește DU",
    },
    expenses: {
      ...base.expenses,
      value: flow.pfaExpenses,
      source: flow.evidence.some((e) => e.kind === "ocr" && e.classification === "pfa-expense")
        ? "imported"
        : base.expenses.source,
      note: flow.evidence.some((e) => e.kind === "ocr" && e.classification === "pfa-expense")
        ? "Din chitanțe confirmate (OCR) + ajustări manuale"
        : base.expenses.note,
    },
    pfRentalIncome: {
      ...base.pfRentalIncome,
      value: flow.pfRentalIncome,
      source: flow.pfRentalIncome ? "manual" : base.pfRentalIncome.source,
    },
    pfOtherIncome: {
      ...base.pfOtherIncome,
      value: flow.pfOtherIncome,
      source: flow.evidence.some((e) => e.kind === "ocr" && e.classification === "pf-income")
        ? "imported"
        : flow.pfOtherIncome
          ? "manual"
          : base.pfOtherIncome.source,
    },
    alsoEmployee: flow.alsoEmployee,
    casOptional: flow.casOptional,
    casBaseChoice: flow.casBaseChoice,
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
