import { derivedThresholds, TAX_CONFIG_2026 } from "./tax-config";
import type { Deadline, DeadlineStatus, Profile } from "./types";

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysUntil(isoDate: string, today = new Date()): number {
  const target = startOfDay(new Date(isoDate));
  const now = startOfDay(today);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

function statusFor(isoDate: string, today = new Date()): DeadlineStatus {
  const days = daysUntil(isoDate, today);
  if (days < 0) return "overdue";
  if (days <= 21) return "soon";
  return "upcoming";
}

export function buildDeadlines(profile: Profile, today = new Date()): Deadline[] {
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const tvaMonth = month === 12 ? 1 : month + 1;
  const tvaYear = month === 12 ? year + 1 : year;
  const thresholds = derivedThresholds(TAX_CONFIG_2026);

  const items: Deadline[] = [
    {
      id: "du-2025",
      title: "Declarația unică — venituri 2025",
      description:
        "D212 pentru anul 2025, depusă de regulă până la 25 mai 2026, împreună cu plata impozitului, CAS și CASS.",
      date: iso(2026, 5, 25),
      category: "declaratie",
      status: statusFor(iso(2026, 5, 25), today),
      href: "/pregateste-du",
    },
    {
      id: "du-2026",
      title: "Declarația unică — venituri 2026",
      description:
        "Estimare și regularizare pentru 2026. Termen uzual: 25 mai 2027. Pregătește pachetul din timp.",
      date: iso(2027, 5, 25),
      category: "declaratie",
      status: statusFor(iso(2027, 5, 25), today),
      href: "/pregateste-du",
    },
    {
      id: "plata-2026",
      title: "Plată impozit + CAS + CASS (an 2026)",
      description: `Orientativ, odată cu D212. Prag CAS: ${thresholds.casThreshold.toLocaleString("ro-RO")} lei venit net.`,
      date: iso(2027, 5, 25),
      category: "plata",
      status: statusFor(iso(2027, 5, 25), today),
      href: "/estimari",
    },
    {
      id: "pachet-luna",
      title: "Pachet lunar către contabil",
      description: "Adună facturi, extrase și cheltuieli. Exportă pachetul și trimite-l pe email.",
      date: iso(year, month, 5),
      category: "lunar",
      status: statusFor(iso(year, month, 5), today),
      href: "/documente/pachet-contabil",
    },
    {
      id: "efactura-setup",
      title: "Înrolare SPV / e-Factura",
      description:
        "Dacă emiți facturi către firme, pregătește certificatul digital și dosarul de setup. Fiscally nu se conectează la ANAF.",
      date: iso(year, month, 15),
      category: "setup",
      status: statusFor(iso(year, month, 15), today),
      href: "/documente/dosar-efactura",
    },
  ];

  if (profile.tvaPayer) {
    items.push({
      id: "tva-d300",
      title: "Decont TVA (D300) — luna curentă",
      description:
        "Termen uzual: 25 ale lunii următoare. Calculează TVA de plată din colectată − deductibilă.",
      date: iso(tvaYear, tvaMonth, 25),
      category: "tva",
      status: statusFor(iso(tvaYear, tvaMonth, 25), today),
      href: "/estimari",
    });
  }

  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export function nextActionableDeadline(deadlines: Deadline[]): Deadline | undefined {
  return (
    deadlines.find((d) => d.status === "overdue") ??
    deadlines.find((d) => d.status === "soon") ??
    deadlines.find((d) => d.status === "upcoming")
  );
}

export function daysUntilLabel(isoDate: string, today = new Date()): string {
  const days = daysUntil(isoDate, today);
  if (days < 0) return `depășit de ${Math.abs(days)} zile`;
  if (days === 0) return "astăzi";
  if (days === 1) return "mâine";
  return `în ${days} zile`;
}
