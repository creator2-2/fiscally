import { ButtonLink } from "@/components/ui/Button";

export function PrepareDuButton({
  href = "/pregateste-du",
  size = "md",
  className = "",
}: {
  href?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <ButtonLink href={href} size={size} className={className}>
      Pregătește Declarația unică
    </ButtonLink>
  );
}
