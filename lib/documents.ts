import type { DocumentId, DocumentMeta } from "./types";

export const DOCUMENTS: DocumentMeta[] = [
  {
    id: "declaratie-unica",
    title: "Declarația unică",
    subtitle: "Checklist ghidat + date precompletate. Nu este XML oficial. Pregătește-o din fluxul principal.",
    pack: "Pachet D212",
    freePreview: true,
    priority: 1,
  },
  {
    id: "situatie-fiscala",
    title: "Situație fiscală",
    subtitle: "Estimare anuală de impozit, CAS și CASS — gata de printat.",
    pack: "PDF fiscal",
    freePreview: false,
    priority: 2,
  },
  {
    id: "pachet-contabil",
    title: "Pachet lunar pentru contabil",
    subtitle: "Sumar, checklist de acte și notă de predare.",
    pack: "Pachet lunar",
    freePreview: false,
    priority: 3,
  },
  {
    id: "dosar-efactura",
    title: "Dosar e-Factura / SPV",
    subtitle: "Pași de înrolare, certificat și checklist educațional.",
    pack: "Dosar setup",
    freePreview: false,
    priority: 4,
  },
  {
    id: "contract-servicii",
    title: "Contract prestări servicii",
    subtitle: "Șablon PFA — de revizuit cu un avocat sau contabil.",
    pack: "Contract",
    freePreview: false,
    priority: 5,
  },
  {
    id: "factura-draft",
    title: "Factură / proformă simplă",
    subtitle: "Ciornă internă. Nu este e-Factura XML și nu se trimite în SPV.",
    pack: "Draft",
    freePreview: false,
    priority: 6,
  },
];

export function getDocument(id: string): DocumentMeta | undefined {
  return DOCUMENTS.find((d) => d.id === id);
}

export function canPreviewDocument(id: DocumentId, subscribed: boolean): boolean {
  if (subscribed) return true;
  return DOCUMENTS.find((d) => d.id === id)?.freePreview === true;
}

export function isExportGated(_id: DocumentId, subscribed: boolean): boolean {
  return !subscribed;
}
