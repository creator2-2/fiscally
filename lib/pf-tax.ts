import { derivedThresholds, getActiveTaxConfig, type TaxConfig } from "./tax-config";

/**
 * Approximate 2026 path for PF "other" income (not PFA sistem real):
 * - Chirii: 10% tax on 80% of gross (20% cheltuială forfetară).
 * - Alte venituri: 10% on net after user expenses.
 * - CASS 10% on the PF net, with the same 6–72 SM band as PFA, labeled approximate.
 * - CAS is not applied on these streams in this model.
 */
export interface PfTaxInput {
  year?: number;
  rentalGross: number;
  otherGross: number;
  otherExpenses: number;
  alsoEmployee: boolean;
}

export interface PfTaxEstimate {
  year: number;
  rentalGross: number;
  rentalForfait: number;
  rentalNet: number;
  otherGross: number;
  otherExpenses: number;
  otherNet: number;
  net: number;
  incomeTax: number;
  cass: number;
  cassBase: number;
  cassNote: string;
  cas: number;
  total: number;
  assumptions: string[];
}

export function computePfEstimate(
  input: PfTaxInput,
  config: TaxConfig = getActiveTaxConfig(input.year ?? 2026),
): PfTaxEstimate {
  const thresholds = derivedThresholds(config);
  const rentalGross = Math.max(0, input.rentalGross || 0);
  const otherGross = Math.max(0, input.otherGross || 0);
  const otherExpenses = Math.min(Math.max(0, input.otherExpenses || 0), otherGross);
  const rentalForfait = rentalGross * 0.2;
  const rentalNet = rentalGross - rentalForfait;
  const otherNet = Math.max(0, otherGross - otherExpenses);
  const net = rentalNet + otherNet;
  const incomeTax = net * config.incomeTaxRate;

  let cassBase = 0;
  let cass = 0;
  let cassNote = "";
  if (net <= 0) {
    cassNote = "Fără venit net PF — CASS din chirii / alte venituri nu este estimat.";
  } else if (net < thresholds.cassFloor) {
    if (input.alsoEmployee) {
      cassBase = net;
      cass = cassBase * config.cassRate;
      cassNote = "Salariat: CASS 10% pe venitul net PF, fără baza minimă de 6 salarii (orientativ).";
    } else {
      cassBase = thresholds.cassFloor;
      cass = cassBase * config.cassRate;
      cassNote = "Sub 6 salarii minime: CASS la baza minimă, dacă nu ești asigurat altfel — verifică.";
    }
  } else {
    cassBase = Math.min(net, thresholds.cassCeiling);
    cass = cassBase * config.cassRate;
    cassNote =
      net > thresholds.cassCeiling
        ? "CASS plafonat la 72 salarii minime (orientativ, venituri PF)."
        : "CASS 10% pe venitul net din chirii / alte venituri (orientativ).";
  }

  return {
    year: config.year,
    rentalGross,
    rentalForfait,
    rentalNet,
    otherGross,
    otherExpenses,
    otherNet,
    net,
    incomeTax,
    cass,
    cassBase,
    cassNote,
    cas: 0,
    total: incomeTax + cass,
    assumptions: [
      "Chirii: cheltuială forfetară 20%, impozit 10% pe 80% din brut — ipoteză 2026, nu sfat fiscal.",
      "Alte venituri PF: impozit 10% pe (brut − cheltuieli introduse).",
      "CAS nu este aplicat pe chirii / alte venituri în acest model.",
      "CASS folosește aceleași plafoane 6–72 salarii minime ca la PFA, etichetat orientativ.",
    ],
  };
}
