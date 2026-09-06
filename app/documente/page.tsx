"use client";

import { AppShell } from "@/components/AppShell";
import { PrepareDuButton } from "@/components/PrepareDuButton";
import { useUpgrade } from "@/components/UpgradeModal";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, Kicker } from "@/components/ui/Card";
import { DOCUMENTS } from "@/lib/documents";
import { useStore } from "@/lib/store";

export default function DocumentsPage() {
  const { subscribed } = useStore();
  const { openUpgrade } = useUpgrade();

  return (
    <AppShell title="Documente" action={<PrepareDuButton size="sm" />}>
      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Jobul principal este Declarația unică. Celelalte pachete (contract, proformă, e-Factura) sunt
        secundare. Exportul PDF rămâne pe paywall.
      </p>
      <div className="mb-6 flex flex-wrap gap-2">
        <PrepareDuButton size="sm" />
        <ButtonLink href="/smartbill" variant="secondary" size="sm">
          Importă din SmartBill
        </ButtonLink>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {DOCUMENTS.map((doc) => {
          const locked = !subscribed && !doc.freePreview;
          return (
            <Card key={doc.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <Kicker>{doc.pack}</Kicker>
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
                  <Button
                    onClick={() =>
                      openUpgrade(`„${doc.title}” este inclus în planul Fiscally, 39 lei/lună.`)
                    }
                  >
                    Deblochează
                  </Button>
                ) : (
                  <ButtonLink href={`/documente/${doc.id}`}>Deschide</ButtonLink>
                )}
                <ButtonLink href={`/documente/${doc.id}`} variant="secondary">
                  Detalii
                </ButtonLink>
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
