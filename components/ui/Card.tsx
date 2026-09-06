import type { ElementType, ReactNode } from "react";

const tones = {
  default: "border-line bg-white",
  mint: "border-sage/25 bg-mint-soft",
  dashed: "border-dashed border-line bg-paper/70",
  ink: "border-transparent bg-ink text-white",
} as const;

export function Card({
  children,
  className = "",
  tone = "default",
  padded = true,
  as: Tag = "article",
}: {
  children: ReactNode;
  className?: string;
  tone?: keyof typeof tones;
  padded?: boolean;
  as?: ElementType;
}) {
  return (
    <Tag
      className={`rounded-3xl border shadow-[0_1px_0_rgba(27,42,34,0.03)] ${tones[tone]} ${
        padded ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Kicker({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${className || "text-sage"}`}
    >
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <Card tone="dashed" className="text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">{text}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </Card>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-mint ${className}`} aria-hidden />;
}
