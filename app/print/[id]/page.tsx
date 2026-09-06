"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { DocumentView } from "@/components/documents/DocumentView";
import { BrandMark } from "@/components/BrandMark";
import { getDocument } from "@/lib/documents";
import { computeEstimate } from "@/lib/tax-engine";
import type { DocumentId } from "@/lib/types";
import { useStore } from "@/lib/store";

export default function PrintPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { profile, subscribed, ready, d212 } = useStore();
  const estimate = useMemo(() => computeEstimate(profile), [profile]);
  const meta = getDocument(params.id);
  const id = meta?.id as DocumentId | undefined;
  const auto = search.get("auto") === "1";

  useEffect(() => {
    if (!ready || !auto || !subscribed || !id) return;
    const t = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(t);
  }, [ready, auto, subscribed, id]);

  if (!ready) {
    return <p className="p-8 text-ink-soft">Se încarcă…</p>;
  }

  if (!meta || !id) {
    return <p className="p-8">Document inexistent.</p>;
  }

  if (!subscribed) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <BrandMark />
        <p className="mt-6 text-ink">Exportul este disponibil după activarea planului de 39 lei/lună.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="no-print mb-4 flex items-center justify-between">
        <BrandMark size="sm" href="/documente" />
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-white"
        >
          Printează / salvează PDF
        </button>
      </div>
      <DocumentView id={id} profile={profile} estimate={estimate} d212={d212} />
    </div>
  );
}
