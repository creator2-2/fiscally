"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PrepareDuButton } from "@/components/PrepareDuButton";
import { useUpgrade } from "@/components/UpgradeModal";
import { DOCUMENTS } from "@/lib/documents";
import { useStore } from "@/lib/store";

export default function DocumentsPage() {
  const { subscribed } = useStore();
  const { openUpgrade } = useUpgrade();

  return (
    <AppShell title="Documente" action={<PrepareDuButton size="sm" />}>
      <p className="mb-4 max-w-2xl text-ink-soft">
        Jobul principal este Declarația unică. Celelalte pachete (contract, proformă, e-Factura) sunt
        secundare. Exportul PDF rămâne pe paywall.
      </p>
      <div className="mb-6 flex flex-wrap gap-2">
        <PrepareDuButton size="sm" />
        <Link
          href="/smartbill"
          className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink"
        >
          Importă din SmartBill
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {DOCUMENTS.map((doc) => {
          const locked = !subscribed && !doc.freePreview;
          return (
            <article key={doc.id} className="flex flex-col rounded-3xl border border-line bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">{doc.pack}</p>
                {doc.freePreview && !subscribed ? (
                  <span className="rounded-full bg-mint px-2 py-0.5 text-[11px] font-semibold text-sage-deep">
                    Preview gratuit
                  </span>
                ) : null}
                {locked ? (
                  <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
                    39 lei
                  </span>
                ) : null}
              </div>
              <h2 className="mt-2 font-display text-2xl text-ink">{doc.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{doc.subtitle}</p>
              <div className="mt-4 flex gap-2">
                {locked ? (
                  <button
                    type="button"
                    onClick={() =>
                      openUpgrade(`„${doc.title}” este inclus în planul Fiscally, 39 lei/lună.`)
                    }
                    className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-white"
                  >
                    Deblochează
                  </button>
                ) : (
                  <Link
                    href={`/documente/${doc.id}`}
                    className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-white"
                  >
                    Deschide
                  </Link>
                )}
                <Link
                  href={`/documente/${doc.id}`}
                  className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink"
                >
                  Detalii
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
