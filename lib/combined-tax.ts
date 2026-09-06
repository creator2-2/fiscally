import { includesPf, includesPfa, type DuFlowState, type FilerRole } from "./du-flow";
import { computePfEstimate, type PfTaxEstimate } from "./pf-tax";
import { computeEstimate } from "./tax-engine";
import type { Profile, TaxEstimate } from "./types";

export interface CombinedEstimate {
  role: FilerRole;
  year: number;
  pfa: TaxEstimate | null;
  pf: PfTaxEstimate | null;
  totalIncome: number;
  totalCas: number;
  totalCass: number;
  totalIncomeTax: number;
  totalDue: number;
}

export function flowToPfaProfile(profile: Profile, flow: DuFlowState): Profile {
  return {
    ...profile,
    fullName: flow.fullName || profile.fullName,
    cui: flow.cui || profile.cui,
    email: flow.email || profile.email,
    activity: flow.pfaActivity,
    fiscalYear: flow.year,
    income: flow.pfaIncome,
    expenses: flow.pfaExpenses,
    alsoEmployee: flow.alsoEmployee,
    casOptional: flow.casOptional,
    casBaseChoice: flow.casBaseChoice,
  };
}

/** Prefer an in-progress DU flow; otherwise estimate from the saved profile. */
export function estimateFlow(profile: Profile, flow: DuFlowState): DuFlowState {
  if (flow.role) {
    return {
      ...flow,
      year: flow.year || profile.fiscalYear,
      fullName: flow.fullName || profile.fullName,
      cui: flow.cui || profile.cui,
      cnp: flow.cnp || profile.cnp,
      email: flow.email || profile.email,
    };
  }
  return {
    ...flow,
    role: profile.filerRole ?? "pfa",
    pfaActivity: profile.activity,
    year: profile.fiscalYear,
    fullName: profile.fullName,
    cui: profile.cui,
    cnp: profile.cnp,
    email: profile.email,
    alsoEmployee: profile.alsoEmployee,
    casOptional: profile.casOptional,
    casBaseChoice: profile.casBaseChoice,
    pfaIncome: profile.income,
    pfaExpenses: profile.expenses,
    pfRentalIncome: profile.pfRentalIncome,
    pfOtherIncome: profile.pfOtherIncome,
    pfOtherExpenses: profile.pfOtherExpenses,
  };
}

export function hydrateFreshFlow(flow: DuFlowState, profile: Profile): DuFlowState {
  const unused =
    !flow.role &&
    !flow.fullName &&
    !flow.evidence.length &&
    !flow.pfaIncome &&
    !flow.pfRentalIncome &&
    !flow.pfOtherIncome;
  if (!unused) return flow;
  return {
    ...flow,
    role: profile.filerRole,
    pfaActivity: profile.activity,
    year: profile.fiscalYear,
    fullName: profile.fullName,
    cui: profile.cui,
    cnp: profile.cnp,
    email: profile.email,
    alsoEmployee: profile.alsoEmployee,
    casOptional: profile.casOptional,
    casBaseChoice: profile.casBaseChoice,
    pfaIncome: profile.income,
    pfaExpenses: profile.expenses,
    pfRentalIncome: profile.pfRentalIncome,
    pfOtherIncome: profile.pfOtherIncome,
    pfOtherExpenses: profile.pfOtherExpenses,
  };
}

export function computeCombined(profile: Profile, flow: DuFlowState): CombinedEstimate | null {
  if (!flow.role) return null;
  const pfa = includesPfa(flow.role) ? computeEstimate(flowToPfaProfile(profile, flow)) : null;
  const pf = includesPf(flow.role)
    ? computePfEstimate({
        year: flow.year,
        rentalGross: flow.pfRentalIncome,
        otherGross: flow.pfOtherIncome,
        otherExpenses: flow.pfOtherExpenses,
        alsoEmployee: flow.alsoEmployee,
      })
    : null;

  return {
    role: flow.role,
    year: flow.year,
    pfa,
    pf,
    totalIncome: (pfa?.income ?? 0) + (pf?.rentalGross ?? 0) + (pf?.otherGross ?? 0),
    totalCas: pfa?.cas ?? 0,
    totalCass: (pfa?.cass ?? 0) + (pf?.cass ?? 0),
    totalIncomeTax: (pfa?.incomeTax ?? 0) + (pf?.incomeTax ?? 0),
    totalDue: (pfa?.totalSocialAndTax ?? 0) + (pf?.total ?? 0),
  };
}
