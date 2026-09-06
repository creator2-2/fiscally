const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0,
});

const ronExact = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberRo = new Intl.NumberFormat("ro-RO", {
  maximumFractionDigits: 0,
});

export function formatRon(value: number, exact = false): string {
  return (exact ? ronExact : ron).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number): string {
  return numberRo.format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toLocaleString("ro-RO", { maximumFractionDigits: 1 })}%`;
}

export function formatDateRo(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ro-RO");
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseMoney(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function displayName(profile: { fullName: string; tradeName: string }): string {
  if (profile.tradeName && profile.fullName) {
    return `${profile.tradeName} (${profile.fullName})`;
  }
  return profile.tradeName || profile.fullName || "PFA fără nume";
}
