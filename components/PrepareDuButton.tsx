import Link from "next/link";

export function PrepareDuButton({
  href = "/pregateste-du",
  size = "md",
  className = "",
}: {
  href?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const pad = size === "sm" ? "px-4 py-2 text-sm" : "px-5 py-2.5 text-sm";
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full bg-sage font-semibold text-white shadow-sm shadow-sage/20 hover:bg-sage-deep ${pad} ${className}`}
    >
      Pregătește Declarația unică
    </Link>
  );
}
