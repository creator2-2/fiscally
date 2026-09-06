import type { CombinedEstimate } from "../combined-tax";
import type { D212Draft } from "../d212-model";
import { emptyD212, flowToD212 } from "../d212-model";
import type { DuFlowState } from "../du-flow";
import { includesPf, includesPfa, ROLE_LABELS } from "../du-flow";
import { formatRon } from "../format";
import type { Profile } from "../types";
import { CHAPTER_LABELS, D212_FIELD_MAP, type AnafChapter, type FieldMapEntry } from "./mapping";
import { anafFormForIncomeYear, type AnafFormEdition } from "./registry";

export const PREFILL_SCHEMA = "fiscally.anaf.prefill.v1";

export interface MappedPrefillField {
  anafKey: string;
  fiscallyPath: string;
  label: string;
  chapter: AnafChapter;
  chapterLabel: string;
  pdfHint: string;
  valueKind: FieldMapEntry["valueKind"];
  value: string | number | boolean;
  display: string;
}

export interface PrefillPackage {
  schema: typeof PREFILL_SCHEMA;
  generatedAt: string;
  disclaimer: string;
  form: AnafFormEdition;
  identity: {
    fullName: string;
    role: string;
    year: number;
  };
  fields: MappedPrefillField[];
  checklist: string[];
  spvSteps: string[];
  totals: {
    income: number;
    due: number;
  };
}

function readPath(draft: D212Draft, derived: Record<string, string | number | boolean>, path: string) {
  if (path.startsWith("derived.")) return derived[path.slice("derived.".length)];
  const parts = path.split(".");
  let cur: unknown = draft;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur as string | number | boolean | undefined;
}

function displayValue(kind: FieldMapEntry["valueKind"], value: string | number | boolean): string {
  if (kind === "money") return formatRon(typeof value === "number" ? value : Number(value) || 0);
  if (kind === "bool") return value ? "Da" : "Nu";
  if (value === "" || value == null) return "—";
  return String(value);
}

export function buildPrefillPackage(
  profile: Profile,
  flow: DuFlowState,
  d212: D212Draft | null,
  combined: CombinedEstimate | null,
): PrefillPackage {
  const draft = flowToD212(profile, flow, d212 ?? emptyD212(profile, flow.year));
  const form = anafFormForIncomeYear(flow.year || draft.year);
  const derived: Record<string, string | number | boolean> = {
    pfaNet: combined?.pfa?.netBeforeContributions ?? Math.max(0, draft.income.value - draft.expenses.value),
    cas: combined?.totalCas ?? 0,
    cass: combined?.totalCass ?? 0,
    incomeTax: combined?.totalIncomeTax ?? 0,
    cap2Note: flow.alsoEmployee
      ? "De regulă nu completezi Cap. II dacă ai deja calitatea de asigurat ca salariat. Verifică."
      : "Completezi Cap. II doar dacă optezi pentru CASS în anul curent, fără altă asigurare.",
  };

  const fields = D212_FIELD_MAP.filter((entry) => {
    if (entry.chapter === "cap1-pfa") return includesPfa(flow.role);
    if (entry.chapter === "cap1-pf") return includesPf(flow.role);
    return true;
  }).map((entry) => {
    const raw = readPath(draft, derived, entry.fiscallyPath);
    const value = raw ?? (entry.valueKind === "money" ? 0 : entry.valueKind === "bool" ? false : "");
    return {
      anafKey: entry.anafKey,
      fiscallyPath: entry.fiscallyPath,
      label: entry.label,
      chapter: entry.chapter,
      chapterLabel: CHAPTER_LABELS[entry.chapter],
      pdfHint: entry.pdfHint,
      valueKind: entry.valueKind,
      value,
      display: displayValue(entry.valueKind, value),
    };
  });

  return {
    schema: PREFILL_SCHEMA,
    generatedAt: new Date().toISOString(),
    disclaimer:
      "Pachet de precompletare Fiscally. Nu este formularul oficial ANAF, nu este XML D212 și nu înseamnă depunere. Tu confirmi și transmiți în SPV.",
    form,
    identity: {
      fullName: draft.identity.fullName || profile.fullName || "—",
      role: draft.identity.filerRole ? ROLE_LABELS[draft.identity.filerRole] : "—",
      year: draft.year,
    },
    fields,
    checklist: [
      "Am verificat CNP / CUI și adresa de domiciliu fiscal.",
      "Sumele din inbox coincid cu evidența mea (facturi, bonuri, chirii).",
      "Am citit broșura ANAF pentru anul de venit.",
      "Am deschis formularul web oficial, nu un PDF vechi găsit pe Google.",
      "Un contabil a văzut cifrele, dacă situația e atipică.",
      "Știu că Fiscally nu depune și nu semnează în locul meu.",
    ],
    spvSteps: [
      "Intră pe anaf.ro și deschide Spațiul Privat Virtual (certificat digital sau credențiale).",
      "Deschide Declarația unică (212) pentru anul veniturilor din acest pachet.",
      "Copiază datele de identificare și sumele din JSON / PDF-ul Fiscally în formularul oficial.",
      "Verifică calculele ANAF — pot diferi de estimarea Fiscally.",
      "Semnează și depune tu. Păstrează recipisa. Fiscally nu vede depunerea.",
    ],
    totals: {
      income: combined?.totalIncome ?? draft.income.value + draft.pfRentalIncome.value + draft.pfOtherIncome.value,
      due: combined?.totalDue ?? 0,
    },
  };
}

export function prefillJson(pkg: PrefillPackage): string {
  return `${JSON.stringify(pkg, null, 2)}\n`;
}

export function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
