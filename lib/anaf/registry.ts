export type AnafArtifactKind = "web-form" | "pdf" | "brochure" | "index" | "spv" | "guide";

export interface AnafArtifact {
  id: string;
  kind: AnafArtifactKind;
  title: string;
  href: string;
  note: string;
}

export interface AnafFormEdition {
  id: string;
  formCode: "212";
  title: string;
  order: string;
  incomeYear: number;
  cassOptionYear: number;
  status: "official" | "provisional";
  lastChecked: string;
  deadlineNote: string;
  artifacts: AnafArtifact[];
  notes: string[];
}

const CHECKED = "2026-09-06";

const ARTIFACTS: AnafArtifact[] = [
  {
    id: "web-duf",
    kind: "web-form",
    title: "Formular web ANAF (Declarația unică)",
    href: "https://www.anaf.ro/declaratii/duf",
    note: "Aplicația oficială de completare. Nu redistribuim binare ANAF.",
  },
  {
    id: "pdf-d212",
    kind: "pdf",
    title: "PDF oficial D212 (OpANAF 2736/2025)",
    href: "https://static.anaf.ro/static/10/Anaf/formulare/D_212_2736_2025.pdf",
    note: "Link oficial. Nu îl stocăm în Fiscally — drepturile de redistribuire sunt neclare.",
  },
  {
    id: "pdf-anexa",
    kind: "pdf",
    title: "Anexa la formularul 212",
    href: "https://static.anaf.ro/static/10/Anaf/formulare/Anexa_D212_2736_2025.pdf",
    note: "Pentru mai multe surse / categorii de venit.",
  },
  {
    id: "brochure",
    kind: "brochure",
    title: "Broșură Declarația unică 212",
    href: "https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Brosura_Declaratia_Unica_212_2025.pdf",
    note: "Instrucțiuni ANAF pentru campania 2026 (venituri 2025).",
  },
  {
    id: "index",
    kind: "index",
    title: "Index formulare Declarația unică",
    href: "https://static.anaf.ro/static/10/Anaf/Declaratii_R/declaratie_unica.html",
    note: "Versiuni pe ani și programe de asistență.",
  },
  {
    id: "spv",
    kind: "spv",
    title: "Spațiul Privat Virtual",
    href: "https://www.anaf.ro/anaf/internet/ANAF/servicii_online/inreg_inrol_pf_pj_spv",
    note: "Înrolare și depunere. Fiscally nu se autentifică în SPV.",
  },
];

const EDITION_2736_2025: Omit<AnafFormEdition, "incomeYear" | "cassOptionYear" | "status" | "notes"> =
  {
    id: "d212-opanef-2736-2025",
    formCode: "212",
    title: "Declarație unică privind impozitul pe venit și contribuțiile sociale (212)",
    order: "OpANAF nr. 2736/2025",
    lastChecked: CHECKED,
    deadlineNote: "De regulă 25 mai a anului următor realizării venitului, inclusiv plata.",
    artifacts: ARTIFACTS,
  };

export function anafFormForIncomeYear(incomeYear: number): AnafFormEdition {
  if (incomeYear <= 2025) {
    return {
      ...EDITION_2736_2025,
      incomeYear,
      cassOptionYear: incomeYear + 1,
      status: "official",
      notes: [
        "Capitolul I: impozit și contribuții pe veniturile realizate.",
        "Capitolul II: opțiune CASS pentru anul curent, dacă e cazul.",
        "Completarea oficială se face în formularul web ANAF sau în SPV.",
      ],
    };
  }
  return {
    ...EDITION_2736_2025,
    incomeYear,
    cassOptionYear: incomeYear + 1,
    status: "provisional",
    notes: [
      `Formularul oficial pentru veniturile din ${incomeYear} apare de regulă la începutul lui ${incomeYear + 1}.`,
      "Până atunci folosim structura OpANAF 2736/2025 ca șablon de precompletare.",
      "Verifică mereu linkurile de pe anaf.ro înainte de depunere.",
    ],
  };
}

export function anafArtifact(id: string, year = 2026): AnafArtifact | undefined {
  return anafFormForIncomeYear(year).artifacts.find((a) => a.id === id);
}
