"use client";

import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, Kicker } from "@/components/ui/Card";
import { downloadPrefillPdf } from "@/lib/anaf/pdf";
import { buildPrefillPackage, downloadTextFile, prefillJson } from "@/lib/anaf/prefill";
import type { CombinedEstimate } from "@/lib/combined-tax";
import type { D212Draft } from "@/lib/d212-model";
import type { DuFlowState } from "@/lib/du-flow";
import { ROLE_LABELS } from "@/lib/du-flow";
import { formatRon } from "@/lib/format";
import type { Profile } from "@/lib/types";

export function AnafDosar({
  profile,
  flow,
  d212,
  combined,
}: {
  profile: Profile;
  flow: DuFlowState;
  d212: D212Draft | null;
  combined: CombinedEstimate | null;
}) {
  const pkg = useMemo(
    () => buildPrefillPackage(profile, flow, d212, combined),
    [profile, flow, d212, combined],
  );
  const [copied, setCopied] = useState(false);
  const web = pkg.form.artifacts.find((a) => a.id === "web-duf");
  const brochure = pkg.form.artifacts.find((a) => a.id === "brochure");
  const spv = pkg.form.artifacts.find((a) => a.id === "spv");

  return (
    <div className="space-y-4">
      <Card tone="mint">
        <Kicker>Dosar gata</Kicker>
        <h2 className="mt-1 font-display text-3xl tracking-tight text-ink">Pregătit pentru ANAF — tu depui</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          {flow.fullName || "Profilul tău"} · {flow.year} ·{" "}
          {flow.role ? ROLE_LABELS[flow.role] : ""} · {formatRon(combined?.totalDue ?? 0)} obligații
          orientative. Fiscally nu transmite nimic către SPV.
        </p>
        {pkg.form.status === "provisional" ? (
          <p className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-xs text-ink-soft">
            Formularul oficial pentru veniturile {pkg.form.incomeYear} e încă provizoriu. Folosim{" "}
            {pkg.form.order} ca șablon. Verificat {pkg.form.lastChecked}.
          </p>
        ) : (
          <p className="mt-3 text-xs text-ink-soft">
            Ediție {pkg.form.order} · verificat {pkg.form.lastChecked}. {pkg.form.deadlineNote}
          </p>
        )}
      </Card>

      <Card>
        <Kicker>Cadru ANAF</Kicker>
        <h3 className="mt-1 font-display text-2xl text-ink">Deschide și precompletează</h3>
        <p className="mt-1 text-sm text-ink-soft">
          Link oficial + pachetul tău de date. Nu pretindem că am depus declarația.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {web ? (
            <ButtonLink href={web.href} external>
              Deschide formularul ANAF
            </ButtonLink>
          ) : null}
          <Button
            variant="secondary"
            onClick={() =>
              downloadTextFile(
                `fiscally-d212-precomplet-${pkg.identity.year}.json`,
                prefillJson(pkg),
                "application/json",
              )
            }
          >
            Descarcă datele precompletate
          </Button>
          <Button variant="secondary" onClick={() => downloadPrefillPdf(pkg)}>
            Descarcă PDF precompletat
          </Button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-soft">
          PDF-ul Fiscally este o fișă de lucru, nu D212 oficial. Formularul ANAF rămâne pe anaf.ro —
          nu îl stocăm aici.
        </p>
      </Card>

      <Card>
        <Kicker>Câmpuri mapate</Kicker>
        <h3 className="mt-1 font-display text-2xl text-ink">Ce pui în formular</h3>
        <ul className="mt-3 divide-y divide-line/80 text-sm">
          {pkg.fields.map((f) => (
            <li key={f.anafKey} className="flex items-start justify-between gap-3 py-2">
              <span>
                <span className="block font-medium text-ink">{f.label}</span>
                <span className="text-xs text-ink-soft">
                  {f.chapterLabel} · {f.anafKey}
                </span>
              </span>
              <span className="shrink-0 font-medium tabular-nums text-ink">{f.display}</span>
            </li>
          ))}
        </ul>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={async () => {
            await navigator.clipboard.writeText(prefillJson(pkg));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copiat în clipboard" : "Copiază JSON"}
        </Button>
      </Card>

      <Card>
        <Kicker>Depunere asistată</Kicker>
        <h3 className="mt-1 font-display text-2xl text-ink">Pași în SPV</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
          {pkg.spvSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <ul className="mt-4 space-y-2">
          {pkg.checklist.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-ink">
              <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border border-line bg-paper" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {spv ? (
            <ButtonLink href={spv.href} variant="secondary" size="sm" external>
              Deschide SPV
            </ButtonLink>
          ) : null}
          {brochure ? (
            <ButtonLink href={brochure.href} variant="ghost" size="sm" external>
              Broșură ANAF
            </ButtonLink>
          ) : null}
          <ButtonLink href="/documente/declaratie-unica" variant="ghost" size="sm">
            Pachet D212 în Documente
          </ButtonLink>
          <ButtonLink href="/estimari" variant="ghost" size="sm">
            Vezi Estimări
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
