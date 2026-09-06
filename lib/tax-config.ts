/**
 * Dated fiscal assumptions for Romanian PFA (sistem real), year 2026.
 * These are approximate planning figures, not official ANAF tables.
 *
 * Reference date: 2026-01-01 (minimum wage used for annual ceilings).
 * Sources commonly cited for 2026 planning: salariu minim 4.050 lei at 1 Jan 2026;
 * CAS 25% on 12 or 24 minimum wages; CASS 10% of net between 6 and 72 SM.
 */
export const TAX_CONFIG_2026 = {
  id: "ro-pfa-sistem-real-2026-01",
  jurisdiction: "RO",
  regime: "PFA sistem real",
  year: 2026,
  asOf: "2026-01-01",
  label: "Ipoteze orientative PFA 2026 (sistem real)",
  currency: "RON",
  minimumWageMonthly: 4050,
  incomeTaxRate: 0.1,
  casRate: 0.25,
  cassRate: 0.1,
  casThresholdMultiples: 12,
  casMaxBaseMultiples: 24,
  cassFloorMultiples: 6,
  cassCeilingMultiples: 72,
  tvaStandardRate: 0.21,
  notes: [
    "Salariul minim de referință pentru plafoanele anuale 2026: 4.050 lei (valoarea de la 1 ianuarie).",
    "CAS 25% este obligatoriu dacă venitul net ≥ 12 salarii minime (48.600 lei). Baza este 12 sau 24 salarii.",
    "CASS 10% se calculează pe venitul net, cu bază minimă 6 salarii (dacă nu ești și salariat) și plafon 72 salarii în 2026.",
    "CAS și CASS sunt tratate ca deductibile din baza impozitului pe venit, în această estimare.",
    "TVA-ul este evidențiat separat și nu se amestecă cu impozitul pe venit.",
    "Norma de venit, microîntreprinderea și SRL-ul nu sunt modelate în acest MVP.",
  ],
} as const;

export type TaxConfig = typeof TAX_CONFIG_2026;

export function getActiveTaxConfig(year = 2026): TaxConfig {
  if (year !== 2026) {
    return TAX_CONFIG_2026;
  }
  return TAX_CONFIG_2026;
}

export function derivedThresholds(config: TaxConfig = TAX_CONFIG_2026) {
  const sm = config.minimumWageMonthly;
  return {
    casThreshold: sm * config.casThresholdMultiples,
    casMinBase: sm * config.casThresholdMultiples,
    casMaxBase: sm * config.casMaxBaseMultiples,
    cassFloor: sm * config.cassFloorMultiples,
    cassCeiling: sm * config.cassCeilingMultiples,
    casAt12: sm * config.casThresholdMultiples * config.casRate,
    casAt24: sm * config.casMaxBaseMultiples * config.casRate,
    cassAtFloor: sm * config.cassFloorMultiples * config.cassRate,
    cassAtCeiling: sm * config.cassCeilingMultiples * config.cassRate,
  };
}
