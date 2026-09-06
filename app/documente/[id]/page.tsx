"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { DocumentView } from "@/components/documents/DocumentView";
import { ExportBar } from "@/components/ExportBar";
import { Field, MoneyInput, SelectInput, TextInput } from "@/components/Fields";
import { useUpgrade } from "@/components/UpgradeModal";
import { canPreviewDocument, getDocument } from "@/lib/documents";
import { computeEstimate } from "@/lib/tax-engine";
import type { DocumentId, InvoiceKind } from "@/lib/types";
import { useStore } from "@/lib/store";

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const meta = getDocument(params.id);
  const { profile, updateProfile, subscribed } = useStore();
  const { openUpgrade } = useUpgrade();
  const estimate = useMemo(() => computeEstimate(profile), [profile]);

  if (!meta) {
    return (
      <AppShell title="Document inexistent">
        <Link href="/documente" className="text-sm font-semibold text-sage-deep">
          Înapoi la documente
        </Link>
      </AppShell>
    );
  }

  const id = meta.id as DocumentId;
  const canSee = canPreviewDocument(id, subscribed);

  return (
    <AppShell title={meta.title} action={<ExportBar id={id} />}>
      <p className="mb-5 text-sm text-ink-soft">{meta.subtitle}</p>

      {id === "factura-draft" || id === "contract-servicii" ? (
        <section className="mb-6 grid gap-3 rounded-3xl border border-line bg-white p-4 sm:grid-cols-2">
          <Field label="Client">
            <TextInput value={profile.clientName} onChange={(e) => updateProfile({ clientName: e.target.value })} />
          </Field>
          <Field label="CUI client">
            <TextInput value={profile.clientCui} onChange={(e) => updateProfile({ clientCui: e.target.value })} />
          </Field>
          <Field label="Adresa client">
            <TextInput
              value={profile.clientAddress}
              onChange={(e) => updateProfile({ clientAddress: e.target.value })}
            />
          </Field>
          {id === "factura-draft" ? (
            <>
              <Field label="Tip">
                <SelectInput
                  value={profile.invoiceKind}
                  onChange={(e) => updateProfile({ invoiceKind: e.target.value as InvoiceKind })}
                >
                  <option value="proforma">Proformă</option>
                  <option value="factura">Factură (draft)</option>
                </SelectInput>
              </Field>
              <Field label="Serie / număr">
                <div className="grid grid-cols-2 gap-2">
                  <TextInput
                    value={profile.invoiceSeries}
                    onChange={(e) => updateProfile({ invoiceSeries: e.target.value })}
                  />
                  <TextInput
                    value={profile.invoiceNumber}
                    onChange={(e) => updateProfile({ invoiceNumber: e.target.value })}
                  />
                </div>
              </Field>
              <Field label="Descriere">
                <TextInput
                  value={profile.invoiceDescription}
                  onChange={(e) => updateProfile({ invoiceDescription: e.target.value })}
                />
              </Field>
              <Field label="Valoare fără TVA (lei)">
                <MoneyInput
                  value={profile.invoiceAmount}
                  onValue={(invoiceAmount) => updateProfile({ invoiceAmount })}
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Durată">
                <TextInput
                  value={profile.contractDuration}
                  onChange={(e) => updateProfile({ contractDuration: e.target.value })}
                />
              </Field>
              <Field label="Valoare contract (lei)">
                <MoneyInput
                  value={profile.contractValue}
                  onValue={(contractValue) => updateProfile({ contractValue })}
                />
              </Field>
            </>
          )}
        </section>
      ) : null}

      {canSee ? (
        <DocumentView id={id} profile={profile} estimate={estimate} />
      ) : (
        <div className="relative overflow-hidden rounded-3xl border border-line">
          <div className="pointer-events-none select-none blur-[3px]">
            <DocumentView id={id} profile={profile} estimate={estimate} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-paper/50 p-6">
            <div className="max-w-sm rounded-3xl bg-white p-5 text-center shadow-xl">
              <p className="font-display text-2xl text-ink">Document plătit</p>
              <p className="mt-2 text-sm text-ink-soft">
                Preview-ul complet și exportul sunt în planul de 39 lei/lună.
              </p>
              <button
                type="button"
                onClick={() => openUpgrade()}
                className="mt-4 rounded-full bg-sage px-4 py-2.5 text-sm font-semibold text-white"
              >
                Activează planul
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
