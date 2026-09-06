"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Field, TextInput } from "@/components/Fields";
import { connectSmartBill } from "@/lib/smartbill/client";
import { useStore } from "@/lib/store";

export default function SmartBillConnectPage() {
  const router = useRouter();
  const { profile, smartbill, setSmartbill } = useStore();
  const [email, setEmail] = useState(smartbill?.email || profile.email || "");
  const [token, setToken] = useState(smartbill?.token || "");
  const [companyVatCode, setCif] = useState(smartbill?.companyVatCode || profile.cui || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [series, setSeries] = useState<string[]>([]);

  async function test() {
    setBusy(true);
    setMessage(null);
    setOk(false);
    try {
      const result = await connectSmartBill({
        email,
        token,
        companyVatCode,
        lastVerifiedAt: null,
      });
      setOk(result.ok);
      setMessage(result.message);
      setSeries((result.data?.series ?? []).map((s) => s.name));
      if (result.ok) {
        await setSmartbill({
          email,
          token,
          companyVatCode,
          lastVerifiedAt: new Date().toISOString(),
        });
      }
    } catch {
      setMessage("Nu am putut ajunge la serverul Fiscally. Reîncearcă.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Conectează SmartBill">
      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Fiscally citește facturile ca să precompleteze Declarația unică. Nu emitem e-Factura și nu
        depunem nimic la ANAF. Tokenul se trimite doar către un route handler Fiscally (BFF), apoi
        spre SmartBill — nu rămâne pe server.
      </p>

      <aside className="mb-5 rounded-2xl border border-soon/30 bg-soon/5 px-4 py-3 text-sm text-ink">
        <strong>Atenție.</strong> Tokenul API este păstrat criptat în localStorage pe acest
        dispozitiv. Oricine are acces la browser îl poate folosi. Nu-l pune în git, nu-l trimite pe
        email. Poți șterge totul din Cont.
      </aside>

      <form
        className="space-y-4 rounded-3xl border border-line bg-white p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void test();
        }}
      >
        <Field label="Email SmartBill" hint="Același email cu care te autentifici în Cloud.">
          <TextInput
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ana@studio.ro"
            required
          />
        </Field>
        <Field
          label="Token API"
          hint="Contul meu → Integrări → API. Nu îl afișăm în console și nu îl salvăm pe server."
        >
          <TextInput
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="••••••••"
            required
          />
        </Field>
        <Field label="CIF / companyVatCode" hint="CIF-ul exact al PFA-ului din Cloud, cu sau fără RO.">
          <TextInput
            value={companyVatCode}
            onChange={(e) => setCif(e.target.value)}
            placeholder="RO12345678"
            required
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-sage px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Se testează…" : "Testează conexiunea"}
          </button>
          <Link
            href="/smartbill/import"
            className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink"
          >
            Sari la import CSV
          </Link>
        </div>
      </form>

      {message ? (
        <p
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            ok ? "bg-mint-soft text-sage-deep" : "bg-overdue/10 text-overdue"
          }`}
        >
          {message}
        </p>
      ) : null}

      {ok ? (
        <div className="mt-4 rounded-3xl border border-line bg-white p-5">
          {series.length ? (
            <p className="text-sm text-ink-soft">Serii găsite: {series.join(", ")}</p>
          ) : (
            <p className="text-sm text-ink-soft">Contul răspunde. Poți importa anul fiscal.</p>
          )}
          <button
            type="button"
            onClick={() => router.push("/smartbill/import")}
            className="mt-3 rounded-full bg-sage px-4 py-2.5 text-sm font-semibold text-white"
          >
            Importă facturile
          </button>
        </div>
      ) : null}

      <p className="mt-6 text-xs leading-relaxed text-ink-soft">
        API V1: Basic Auth email:token, bază{" "}
        <code className="rounded bg-white px-1">https://ws.smartbill.ro/SBORO/api</code>. Limită circa
        3 cereri/secundă. Planurile fără API sau fără drepturi vor eșua aici, nu în ANAF.
      </p>
    </AppShell>
  );
}
