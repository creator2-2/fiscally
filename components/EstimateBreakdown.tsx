import { formatPercent, formatRon } from "@/lib/format";
import type { TaxEstimate } from "@/lib/types";
import { Disclaimer } from "./Disclaimer";

export function EstimateBreakdown({
  estimate,
  compact = false,
}: {
  estimate: TaxEstimate;
  compact?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Venit net" value={formatRon(estimate.netBeforeContributions)} />
        <Stat label="Total contribuții + impozit" value={formatRon(estimate.totalSocialAndTax)} />
        <Stat
          label="Rămâne după taxe (orientativ)"
          value={formatRon(estimate.netAfterTax)}
          accent
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-line bg-white">
        {estimate.lines.map((line) => (
          <div
            key={line.id}
            className="flex items-start justify-between gap-4 border-b border-line/80 px-4 py-3 last:border-b-0"
          >
            <div>
              <p className="text-sm font-medium text-ink">{line.label}</p>
              <p className="text-xs text-ink-soft">{line.detail}</p>
            </div>
            <p
              className={`shrink-0 text-sm font-semibold tabular-nums ${
                line.amount < 0 ? "text-ink-soft" : "text-ink"
              }`}
            >
              {formatRon(line.amount)}
            </p>
          </div>
        ))}
        <div className="flex items-center justify-between bg-mint-soft px-4 py-3">
          <p className="text-sm font-semibold text-ink">Rată efectivă pe venit brut</p>
          <p className="text-sm font-semibold text-sage-deep">{formatPercent(estimate.effectiveRate)}</p>
        </div>
      </div>

      {estimate.tvaDue !== null ? (
        <div className="rounded-3xl border border-line bg-white px-4 py-3">
          <p className="text-sm font-medium text-ink">TVA de plată (separat)</p>
          <p className="font-display text-2xl text-ink">{formatRon(estimate.tvaDue)}</p>
          <p className="text-xs text-ink-soft">TVA colectată − TVA deductibilă. Nu se adună la impozitul pe venit.</p>
        </div>
      ) : null}

      {!compact ? (
        <>
          <p className="text-sm text-ink-soft">{estimate.cassNote}</p>
          <Disclaimer />
        </>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-3xl border border-line px-4 py-3 ${accent ? "bg-mint-soft" : "bg-white"}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}
