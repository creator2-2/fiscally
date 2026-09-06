import { derivedThresholds, getActiveTaxConfig, type TaxConfig } from "./tax-config";
import type { Profile, TaxEstimate, TaxLine } from "./types";

export function computeEstimate(
  profile: Profile,
  config: TaxConfig = getActiveTaxConfig(profile.fiscalYear),
): TaxEstimate {
  const thresholds = derivedThresholds(config);
  const income = Math.max(0, profile.income || 0);
  const expenses = Math.min(Math.max(0, profile.expenses || 0), income);
  const net = Math.max(0, income - expenses);

  const casMandatory = net >= thresholds.casThreshold;
  let casBase = 0;
  let cas = 0;
  let casOptionalApplied = false;

  if (casMandatory) {
    const wants24 = profile.casBaseChoice === "24" || net >= thresholds.casMaxBase;
    casBase = wants24 ? thresholds.casMaxBase : thresholds.casMinBase;
    if (net >= thresholds.casMaxBase) casBase = thresholds.casMaxBase;
    cas = casBase * config.casRate;
  } else if (profile.casOptional) {
    casBase = thresholds.casMinBase;
    cas = casBase * config.casRate;
    casOptionalApplied = true;
  }

  let cassBase = 0;
  let cass = 0;
  let cassNote = "";

  if (net <= 0) {
    cass = 0;
    cassNote = profile.alsoEmployee
      ? "Fără venit net PFA — CASS din activitate independentă nu este estimat."
      : "Fără venit net. În practică, CASS minim poate rămâne datorat dacă nu ești asigurat altfel — verifică cu un contabil.";
  } else if (net < thresholds.cassFloor) {
    if (profile.alsoEmployee) {
      cassBase = net;
      cass = cassBase * config.cassRate;
      cassNote =
        "Ai marcat că ești și salariat: estimăm CASS 10% pe venitul net PFA, fără baza minimă de 6 salarii.";
    } else {
      cassBase = thresholds.cassFloor;
      cass = cassBase * config.cassRate;
      cassNote =
        "Venit sub 6 salarii minime: estimăm CASS la baza minimă (6 × salariu minim), dacă nu ești asigurat ca salariat.";
    }
  } else {
    cassBase = Math.min(net, thresholds.cassCeiling);
    cass = cassBase * config.cassRate;
    cassNote =
      net > thresholds.cassCeiling
        ? "Venit peste plafonul de 72 salarii minime: CASS plafonat."
        : "CASS 10% aplicat pe venitul net (între 6 și 72 salarii minime).";
  }

  const taxableIncome = Math.max(0, net - cas - cass);
  const incomeTax = taxableIncome * config.incomeTaxRate;
  const totalSocialAndTax = cas + cass + incomeTax;
  const netAfterTax = net - totalSocialAndTax;
  const effectiveRate = income > 0 ? totalSocialAndTax / income : 0;
  const tvaDue = profile.tvaPayer
    ? Math.max(0, (profile.tvaCollected || 0) - (profile.tvaDeductible || 0))
    : null;

  const lines: TaxLine[] = [
    {
      id: "income",
      label: "Venituri brute",
      detail: `Anul ${config.year}, sistem real`,
      amount: income,
    },
    {
      id: "expenses",
      label: "Cheltuieli deductibile",
      detail: "Introduse de tine în asistent",
      amount: -expenses,
    },
    {
      id: "net",
      label: "Venit net înainte de contribuții",
      detail: "Venituri − cheltuieli",
      amount: net,
    },
    {
      id: "cas",
      label: "CAS (pensie)",
      detail: casMandatory
        ? `25% × ${casBase.toLocaleString("ro-RO")} lei bază`
        : casOptionalApplied
          ? "Opțional, la baza de 12 salarii minime"
          : `Sub pragul de ${thresholds.casThreshold.toLocaleString("ro-RO")} lei — nu e obligatoriu`,
      amount: cas,
      optional: !casMandatory && !casOptionalApplied,
    },
    {
      id: "cass",
      label: "CASS (sănătate)",
      detail: cassBase
        ? `10% × ${cassBase.toLocaleString("ro-RO")} lei bază`
        : cassNote,
      amount: cass,
    },
    {
      id: "tax",
      label: "Impozit pe venit",
      detail: `10% × ${taxableIncome.toLocaleString("ro-RO")} lei (venit net − CAS − CASS)`,
      amount: incomeTax,
    },
  ];

  return {
    year: config.year,
    configLabel: config.label,
    income,
    expenses,
    netBeforeContributions: net,
    cas,
    casBase,
    casMandatory,
    casOptionalApplied,
    cass,
    cassBase,
    cassNote,
    taxableIncome,
    incomeTax,
    totalSocialAndTax,
    netAfterTax,
    effectiveRate,
    tvaDue,
    lines,
    assumptions: [...config.notes],
  };
}
