/**
 * Adapter Fiscally D212 → chei logice ale formularului 212.
 * Cheile `anafKey` sunt stabile în Fiscally. La un an nou, actualizezi
 * registry + eventuale `pdfHint` / note, nu restul aplicației.
 *
 * Formularul oficial 2026 e în principal web (anaf.ro/declaratii/duf),
 * nu un PDF AcroForm de încredere. `pdfHint` e o etichetă umană, nu un
 * nume de câmp Adobe descoperit.
 */
export type AnafChapter = "identificare" | "cap1-pfa" | "cap1-pf" | "contributii" | "cap2";

export interface FieldMapEntry {
  anafKey: string;
  fiscallyPath: string;
  label: string;
  chapter: AnafChapter;
  pdfHint: string;
  valueKind: "text" | "money" | "bool" | "year";
}

export const D212_FIELD_MAP: FieldMapEntry[] = [
  {
    anafKey: "ident.nume",
    fiscallyPath: "identity.fullName",
    label: "Nume și prenume",
    chapter: "identificare",
    pdfHint: "Date identificare · nume",
    valueKind: "text",
  },
  {
    anafKey: "ident.cnp",
    fiscallyPath: "identity.cnp",
    label: "CNP",
    chapter: "identificare",
    pdfHint: "Date identificare · CNP",
    valueKind: "text",
  },
  {
    anafKey: "ident.cui",
    fiscallyPath: "identity.cui",
    label: "CUI PFA",
    chapter: "identificare",
    pdfHint: "Activitate independentă · CUI",
    valueKind: "text",
  },
  {
    anafKey: "ident.email",
    fiscallyPath: "identity.email",
    label: "Email",
    chapter: "identificare",
    pdfHint: "Date de contact",
    valueKind: "text",
  },
  {
    anafKey: "ident.judet",
    fiscallyPath: "identity.county",
    label: "Județ",
    chapter: "identificare",
    pdfHint: "Domiciliu fiscal · județ",
    valueKind: "text",
  },
  {
    anafKey: "ident.localitate",
    fiscallyPath: "identity.city",
    label: "Localitate",
    chapter: "identificare",
    pdfHint: "Domiciliu fiscal · localitate",
    valueKind: "text",
  },
  {
    anafKey: "ident.adresa",
    fiscallyPath: "identity.address",
    label: "Adresă",
    chapter: "identificare",
    pdfHint: "Domiciliu fiscal · adresă",
    valueKind: "text",
  },
  {
    anafKey: "cap1.an_venit",
    fiscallyPath: "year",
    label: "Anul veniturilor (Cap. I)",
    chapter: "cap1-pfa",
    pdfHint: "Capitolul I · anul realizării",
    valueKind: "year",
  },
  {
    anafKey: "cap1.ai.venit_brut",
    fiscallyPath: "income.value",
    label: "Venit brut activitate independentă",
    chapter: "cap1-pfa",
    pdfHint: "Venituri din activități independente · sistem real · venit brut",
    valueKind: "money",
  },
  {
    anafKey: "cap1.ai.cheltuieli",
    fiscallyPath: "expenses.value",
    label: "Cheltuieli deductibile PFA",
    chapter: "cap1-pfa",
    pdfHint: "Activități independente · cheltuieli",
    valueKind: "money",
  },
  {
    anafKey: "cap1.ai.venit_net",
    fiscallyPath: "derived.pfaNet",
    label: "Venit net PFA (înainte de contribuții)",
    chapter: "cap1-pfa",
    pdfHint: "Activități independente · venit net",
    valueKind: "money",
  },
  {
    anafKey: "cap1.chirii.brut",
    fiscallyPath: "pfRentalIncome.value",
    label: "Venituri din chirii (brut)",
    chapter: "cap1-pf",
    pdfHint: "Venituri din cedarea folosinței bunurilor",
    valueKind: "money",
  },
  {
    anafKey: "cap1.alte.brut",
    fiscallyPath: "pfOtherIncome.value",
    label: "Alte venituri PF (brut)",
    chapter: "cap1-pf",
    pdfHint: "Alte surse · venit brut",
    valueKind: "money",
  },
  {
    anafKey: "contrib.cas",
    fiscallyPath: "derived.cas",
    label: "CAS estimat",
    chapter: "contributii",
    pdfHint: "Contribuția de asigurări sociale",
    valueKind: "money",
  },
  {
    anafKey: "contrib.cass",
    fiscallyPath: "derived.cass",
    label: "CASS estimat",
    chapter: "contributii",
    pdfHint: "Contribuția de asigurări sociale de sănătate",
    valueKind: "money",
  },
  {
    anafKey: "contrib.impozit",
    fiscallyPath: "derived.incomeTax",
    label: "Impozit pe venit estimat",
    chapter: "contributii",
    pdfHint: "Impozit anual pe venit",
    valueKind: "money",
  },
  {
    anafKey: "ident.salariat",
    fiscallyPath: "alsoEmployee",
    label: "Ești și salariat",
    chapter: "identificare",
    pdfHint: "Poate afecta baza minimă CASS",
    valueKind: "bool",
  },
  {
    anafKey: "contrib.cas_optional",
    fiscallyPath: "casOptional",
    label: "CAS opțional (sub prag)",
    chapter: "contributii",
    pdfHint: "Opțiune plată CAS",
    valueKind: "bool",
  },
  {
    anafKey: "contrib.cas_baza",
    fiscallyPath: "casBaseChoice",
    label: "Bază CAS (12 / 24 salarii)",
    chapter: "contributii",
    pdfHint: "Baza de calcul CAS",
    valueKind: "text",
  },
  {
    anafKey: "cap2.optiune_cass",
    fiscallyPath: "derived.cap2Note",
    label: "Cap. II — opțiune CASS an curent",
    chapter: "cap2",
    pdfHint: "Capitolul II · opțiune CASS",
    valueKind: "text",
  },
];

export const CHAPTER_LABELS: Record<AnafChapter, string> = {
  identificare: "Date de identificare",
  "cap1-pfa": "Cap. I · Activitate independentă",
  "cap1-pf": "Cap. I · Venituri persoană fizică",
  contributii: "Contribuții și impozit (orientativ)",
  cap2: "Cap. II · Opțiune CASS",
};
