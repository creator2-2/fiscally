import Link from "next/link";

export function BrandMark({
  href = "/",
  size = "md",
  light = false,
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  light?: boolean;
}) {
  const sizes = {
    sm: { box: "h-8 w-8", word: "text-lg", tag: "hidden" },
    md: { box: "h-10 w-10", word: "text-xl", tag: "text-[11px]" },
    lg: { box: "h-12 w-12", word: "text-2xl", tag: "text-xs" },
  }[size];

  return (
    <Link href={href} className="inline-flex items-center gap-2.5">
      <span
        className={`${sizes.box} grid place-items-center rounded-2xl bg-sage text-white shadow-[0_8px_20px_-12px_rgba(62,101,82,0.8)]`}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="none">
          <path
            d="M6 16.5c2.2-5 4.2-7.8 6-8.5 1.8.7 3.8 3.5 6 8.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8.2 13.2h7.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="leading-tight">
        <span className={`font-display font-semibold tracking-tight ${sizes.word} ${light ? "text-white" : "text-ink"}`}>
          Fiscally
        </span>
        <span className={`block font-medium tracking-wide text-ink-soft ${sizes.tag}`}>
          Pregătește. Exportă. Depune.
        </span>
      </span>
    </Link>
  );
}
