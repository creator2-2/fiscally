import type { ActivityType, CasBaseChoice } from "./types";

export type FilerRole = "pf" | "pfa" | "ambele";
export type DuStep = 1 | 2 | 3 | 4 | 5 | 6;
export type EvidenceKind = "csv" | "smartbill" | "manual" | "pdf";

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  label: string;
  year: number;
  addedAt: string;
  invoiceCount?: number;
  total?: number;
  note?: string;
}

export interface DuFlowState {
  step: DuStep;
  role: FilerRole | null;
  pfaActivity: ActivityType;
  year: number;
  fullName: string;
  cui: string;
  cnp: string;
  email: string;
  alsoEmployee: boolean;
  casOptional: boolean;
  casBaseChoice: CasBaseChoice;
  pfaIncome: number;
  pfaExpenses: number;
  pfRentalIncome: number;
  pfOtherIncome: number;
  pfOtherExpenses: number;
  evidence: EvidenceItem[];
}

export const DU_STEPS: { id: DuStep; title: string; short: string }[] = [
  { id: 1, title: "Cine depune", short: "Cine" },
  { id: 2, title: "An fiscal", short: "An" },
  { id: 3, title: "Adaugă dovezi", short: "Dovezi" },
  { id: 4, title: "Calcul automat", short: "Calcul" },
  { id: 5, title: "Revizuiește DU", short: "Revizuire" },
  { id: 6, title: "Dosar gata", short: "Dosar" },
];

export const ROLE_LABELS: Record<FilerRole, string> = {
  pf: "Persoană fizică",
  pfa: "PFA / profesie liberală",
  ambele: "Ambele (PF + PFA)",
};

export function defaultDuFlow(): DuFlowState {
  return {
    step: 1,
    role: null,
    pfaActivity: "it",
    year: 2026,
    fullName: "",
    cui: "",
    cnp: "",
    email: "",
    alsoEmployee: false,
    casOptional: false,
    casBaseChoice: "12",
    pfaIncome: 0,
    pfaExpenses: 0,
    pfRentalIncome: 0,
    pfOtherIncome: 0,
    pfOtherExpenses: 0,
    evidence: [],
  };
}

export function includesPfa(role: FilerRole | null): boolean {
  return role === "pfa" || role === "ambele";
}

export function includesPf(role: FilerRole | null): boolean {
  return role === "pf" || role === "ambele";
}

export function mergeDuFlow(saved: Partial<DuFlowState> | null): DuFlowState {
  return { ...defaultDuFlow(), ...(saved ?? {}) };
}

export function applyImportToFlow(
  flow: DuFlowState,
  input: {
    kind: EvidenceKind;
    label: string;
    year: number;
    invoiceCount: number;
    total: number;
    note?: string;
  },
): DuFlowState {
  const item: EvidenceItem = {
    id: `${input.kind}-${Date.now()}`,
    kind: input.kind,
    label: input.label,
    year: input.year,
    addedAt: new Date().toISOString(),
    invoiceCount: input.invoiceCount,
    total: input.total,
    note: input.note,
  };
  const pfa = includesPfa(flow.role) || !includesPf(flow.role);
  return {
    ...flow,
    year: input.year,
    pfaIncome: pfa ? input.total : flow.pfaIncome,
    pfOtherIncome: pfa ? flow.pfOtherIncome : input.total,
    evidence: [...flow.evidence, item],
    step: flow.step < 3 ? 3 : flow.step,
  };
}
