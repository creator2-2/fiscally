"use client";

import { useRouter } from "next/navigation";
import type { DocumentId } from "@/lib/types";
import { isExportGated } from "@/lib/documents";
import { useStore } from "@/lib/store";
import { useUpgrade } from "./UpgradeModal";

export function ExportBar({ id, label = "Exportă PDF" }: { id: DocumentId; label?: string }) {
  const router = useRouter();
  const { subscribed } = useStore();
  const { openUpgrade } = useUpgrade();
  const gated = isExportGated(id, subscribed);

  function exportPdf() {
    if (gated) {
      openUpgrade("Exportul PDF este inclus în planul de 39 lei/lună.");
      return;
    }
    router.push(`/print/${id}?auto=1`);
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <button
        type="button"
        onClick={exportPdf}
        className="rounded-full bg-sage px-4 py-2.5 text-sm font-semibold text-white hover:bg-sage-deep"
      >
        {gated ? "Exportă PDF · 39 lei" : label}
      </button>
      <button
        type="button"
        onClick={() => {
          if (gated) {
            openUpgrade("Printul documentelor complete este inclus în planul plătit.");
            return;
          }
          router.push(`/print/${id}`);
        }}
        className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-paper"
      >
        Deschide pentru print
      </button>
    </div>
  );
}
