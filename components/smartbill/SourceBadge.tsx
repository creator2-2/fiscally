import { sourceLabel, type FieldSource } from "@/lib/d212-model";

export function SourceBadge({ source }: { source: FieldSource }) {
  const tone =
    source === "imported"
      ? "bg-mint text-sage-deep"
      : source === "estimated"
        ? "bg-paper text-ink-soft"
        : "bg-white text-ink-soft border border-line";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {sourceLabel(source)}
    </span>
  );
}
