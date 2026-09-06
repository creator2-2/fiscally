"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { buildDeadlines, daysUntilLabel } from "@/lib/deadlines";
import { formatShortDate } from "@/lib/format";
import { useStore } from "@/lib/store";

const STATUS: Record<string, { label: string; className: string }> = {
  overdue: { label: "Depășit", className: "bg-overdue/10 text-overdue" },
  soon: { label: "Curând", className: "bg-soon/10 text-soon" },
  upcoming: { label: "Programat", className: "bg-mint text-sage-deep" },
  "done-hint": { label: "Verifică", className: "bg-paper text-ink-soft" },
};

export default function TermenePage() {
  const { profile } = useStore();
  const deadlines = buildDeadlines(profile);

  return (
    <AppShell title="Termene">
      <p className="mb-6 max-w-2xl text-ink-soft">
        Calendar orientativ din configurația 2026, nu un feed ANAF. Roșul apare doar la termene
        depășite.
      </p>
      <ul className="space-y-3">
        {deadlines.map((d) => {
          const badge = STATUS[d.status];
          return (
            <li key={d.id} className="rounded-3xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                  {badge.label}
                </span>
                <span className="text-xs text-ink-soft">
                  {formatShortDate(d.date)} · {daysUntilLabel(d.date)}
                </span>
              </div>
              <h2 className="mt-2 font-display text-2xl text-ink">{d.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d.description}</p>
              {d.href ? (
                <Link href={d.href} className="mt-3 inline-flex text-sm font-semibold text-sage-deep">
                  Deschide →
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
