import type { D212Draft } from "@/lib/d212-model";
import { sourceLabel } from "@/lib/d212-model";
import { formatDateRo, formatRon, formatShortDate, displayName, todayIso } from "@/lib/format";
import { derivedThresholds, TAX_CONFIG_2026 } from "@/lib/tax-config";
import type { DocumentId, Profile, TaxEstimate } from "@/lib/types";
import { ACTIVITY_LABELS } from "@/lib/types";

export function DocumentView({
  id,
  profile,
  estimate,
  d212,
}: {
  id: DocumentId;
  profile: Profile;
  estimate: TaxEstimate;
  d212?: D212Draft | null;
}) {
  switch (id) {
    case "situatie-fiscala":
      return <SituatieFiscala profile={profile} estimate={estimate} />;
    case "declaratie-unica":
      return <DeclaratieUnica profile={profile} estimate={estimate} d212={d212} />;
    case "pachet-contabil":
      return <PachetContabil profile={profile} estimate={estimate} />;
    case "dosar-efactura":
      return <DosarEfactura profile={profile} />;
    case "contract-servicii":
      return <ContractServicii profile={profile} />;
    case "factura-draft":
      return <FacturaDraft profile={profile} />;
    default:
      return null;
  }
}

function Sheet({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <article className="print-sheet rounded-3xl border border-line bg-white p-6 shadow-sm md:p-8">
      <header className="border-b border-line pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">{kicker}</p>
        <h2 className="mt-1 font-display text-3xl text-ink">{title}</h2>
        <p className="mt-1 text-xs text-ink-soft">Generat de Fiscally · {formatDateRo(todayIso())}</p>
      </header>
      <div className="mt-5 space-y-5 text-sm leading-relaxed text-ink">{children}</div>
    </article>
  );
}

function SituatieFiscala({ profile, estimate }: { profile: Profile; estimate: TaxEstimate }) {
  const t = derivedThresholds(TAX_CONFIG_2026);
  return (
    <Sheet kicker="Situație fiscală orientativă" title={`An fiscal ${estimate.year}`}>
      <section>
        <h3 className="font-display text-xl text-ink">Contribuabil</h3>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          <Pair label="PFA" value={displayName(profile)} />
          <Pair label="CUI" value={profile.cui || "—"} />
          <Pair label="Activitate" value={`${ACTIVITY_LABELS[profile.activity]} · CAEN ${profile.caen || "—"}`} />
          <Pair label="Sediu" value={[profile.address, profile.city, profile.county].filter(Boolean).join(", ") || "—"} />
        </dl>
      </section>

      <section>
        <h3 className="font-display text-xl text-ink">Rezultat estimat</h3>
        <table className="mt-2 w-full text-left">
          <tbody>
            {estimate.lines.map((line) => (
              <tr key={line.id} className="border-b border-line/70">
                <td className="py-2 pr-3">
                  <div className="font-medium">{line.label}</div>
                  <div className="text-xs text-ink-soft">{line.detail}</div>
                </td>
                <td className="py-2 text-right tabular-nums font-semibold">{formatRon(line.amount)}</td>
              </tr>
            ))}
            <tr>
              <td className="py-3 font-semibold">Total CAS + CASS + impozit</td>
              <td className="py-3 text-right font-semibold tabular-nums">
                {formatRon(estimate.totalSocialAndTax)}
              </td>
            </tr>
            <tr>
              <td className="py-1 text-ink-soft">Net după taxe (orientativ)</td>
              <td className="py-1 text-right tabular-nums">{formatRon(estimate.netAfterTax)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {estimate.tvaDue !== null ? (
        <section>
          <h3 className="font-display text-xl text-ink">TVA</h3>
          <p>
            Plătitor TVA. Colectată {formatRon(profile.tvaCollected)} − deductibilă{" "}
            {formatRon(profile.tvaDeductible)} = <strong>{formatRon(estimate.tvaDue)}</strong> de plată
            (evidență separată).
          </p>
        </section>
      ) : (
        <p>Nu ești marcat ca plătitor de TVA în profil.</p>
      )}

      <section>
        <h3 className="font-display text-xl text-ink">Plafoane folosite ({TAX_CONFIG_2026.asOf})</h3>
        <ul className="list-disc space-y-1 pl-5 text-ink-soft">
          <li>Salariu minim de referință: {formatRon(TAX_CONFIG_2026.minimumWageMonthly)} / lună</li>
          <li>Prag CAS: {formatRon(t.casThreshold)} · CAS la 12 SM: {formatRon(t.casAt12)} · la 24 SM: {formatRon(t.casAt24)}</li>
          <li>CASS bază min. {formatRon(t.cassFloor)} · plafon {formatRon(t.cassCeiling)}</li>
        </ul>
      </section>

      <Footnote />
    </Sheet>
  );
}

function DeclaratieUnica({
  profile,
  estimate,
  d212,
}: {
  profile: Profile;
  estimate: TaxEstimate;
  d212?: D212Draft | null;
}) {
  const steps = [
    "Intră în SPV (Spațiul Privat Virtual) cu certificatul digital sau credențialele ANAF.",
    "Deschide Declarația unică (D212) pentru anul de venit. Nu folosi acest pachet ca fișier oficial.",
    "Completează datele de identificare cu valorile din tabelul de mai jos.",
    "Completează capitolul de venituri din activități independente — sistem real.",
    "Verifică bazele de CAS și CASS. Ajustează dacă ai și salariu sau alte venituri.",
    "Salvează, semnează și depune în SPV. Plătește obligațiile până la termenul afișat de ANAF.",
  ];

  const checks = [
    "Am CUI-ul și datele PFA corecte",
    "Am extrasul de venituri și cheltuieli pe an",
    "Am lista de facturi emise / încasate",
    "Știu dacă sunt plătitor de TVA",
    "Am decis baza de CAS (12 sau 24 salarii), dacă e cazul",
    "Am verificat dacă sunt și salariat (afectează CASS minim)",
    "Am certificat digital sau acces SPV funcțional",
    "Voi cere unui contabil să revizuiască cifrele înainte de depunere",
  ];

  return (
    <Sheet kicker="Pachet ghidat — nu este XML oficial" title="Declarația unică (D212)">
      <p>
        Acest pachet îți preumple datele și îți arată ce să verifici.{" "}
        <strong>Nu generează fișierul oficial ANAF</strong> și nu îl poate depune Fiscally.
      </p>

      <section>
        <h3 className="font-display text-xl text-ink">Date de precompletat</h3>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          <Pair label="Nume" value={profile.fullName || "—"} />
          <Pair label="Denumire PFA" value={profile.tradeName || "—"} />
          <Pair label="CUI" value={profile.cui || "—"} />
          <Pair label="Email" value={profile.email || "—"} />
          <Pair label="Telefon" value={profile.phone || "—"} />
          <Pair label="Județ / localitate" value={`${profile.county}${profile.city ? `, ${profile.city}` : ""}`} />
          <Pair
            label={`Venituri brute ${estimate.year}`}
            value={`${formatRon(estimate.income)}${d212 ? ` · ${sourceLabel(d212.income.source)}` : ""}`}
          />
          <Pair
            label="Cheltuieli deductibile"
            value={`${formatRon(estimate.expenses)}${d212 ? ` · ${sourceLabel(d212.expenses.source)}` : ""}`}
          />
          <Pair label="Venit net" value={formatRon(estimate.netBeforeContributions)} />
          <Pair label="CAS estimat" value={`${formatRon(estimate.cas)} · estimat`} />
          <Pair label="CASS estimat" value={`${formatRon(estimate.cass)} · estimat`} />
          <Pair label="Impozit estimat" value={`${formatRon(estimate.incomeTax)} · estimat`} />
        </dl>
      </section>

      {d212?.importSummary ? (
        <section>
          <h3 className="font-display text-xl text-ink">Proveniență venituri</h3>
          <p>
            {d212.importSummary.source === "csv" ? "CSV" : "SmartBill"} ·{" "}
            {d212.importSummary.includedCount} documente · {formatRon(d212.importSummary.totalIncome)} în{" "}
            {d212.importSummary.year}. Proformele nu sunt incluse. Verifică înainte de SPV.
          </p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {d212.importSummary.months.map((m) => (
              <li key={m.month} className="rounded-xl bg-paper px-3 py-2">
                {m.label}: {formatRon(m.total)} ({m.count})
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="font-display text-xl text-ink">Pași în SPV</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className="font-display text-xl text-ink">Checklist înainte de depunere</h3>
        <ul className="mt-2 space-y-2">
          {checks.map((c) => (
            <li key={c} className="flex gap-2 rounded-xl bg-paper px-3 py-2">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-line bg-white" />
              {c}
            </li>
          ))}
        </ul>
      </section>

      <Footnote extra="Termen uzual de depunere și plată: 25 mai a anului următor anului de venit." />
    </Sheet>
  );
}

function PachetContabil({ profile, estimate }: { profile: Profile; estimate: TaxEstimate }) {
  const monthLabel = new Date().toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
  const docs = [
    "Facturi emise (sau ciorne, dacă încă nu ești pe e-Factura)",
    "Extras de cont / încasări",
    "Bonuri și facturi de cheltuieli deductibile",
    "Contractele noi semnate în lună",
    "Dovezi plăți contribuții, dacă există",
    profile.tvaPayer ? "Jurnal TVA — colectată și deductibilă" : "Confirmare că nu ești plătitor TVA",
  ];

  return (
    <Sheet kicker="Pachet lunar" title={`Predare contabil · ${monthLabel}`}>
      <p>
        Bună ziua,{" "}
        {displayName(profile)} vă transmite situația orientativă pe {monthLabel}, ca bază de lucru.
        Cifrele anuale de mai jos sunt estimate, nu balanță contabilă.
      </p>

      <section>
        <h3 className="font-display text-xl text-ink">Identificare</h3>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          <Pair label="PFA" value={displayName(profile)} />
          <Pair label="CUI" value={profile.cui || "—"} />
          <Pair label="Contact" value={[profile.email, profile.phone].filter(Boolean).join(" · ") || "—"} />
          <Pair label="CAEN" value={`${profile.caen || "—"} · ${profile.activityDescription || ACTIVITY_LABELS[profile.activity]}`} />
        </dl>
      </section>

      <section>
        <h3 className="font-display text-xl text-ink">Sumar anual (YTD / estimat {estimate.year})</h3>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          <Pair label="Venituri" value={formatRon(estimate.income)} />
          <Pair label="Cheltuieli" value={formatRon(estimate.expenses)} />
          <Pair label="CAS + CASS + impozit" value={formatRon(estimate.totalSocialAndTax)} />
          <Pair
            label="TVA de plată"
            value={estimate.tvaDue === null ? "Nu e plătitor TVA" : formatRon(estimate.tvaDue)}
          />
        </ul>
      </section>

      <section>
        <h3 className="font-display text-xl text-ink">Documente atașate / de atașat</h3>
        <ul className="mt-2 space-y-2">
          {docs.map((d) => (
            <li key={d} className="flex gap-2 rounded-xl bg-paper px-3 py-2">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-line bg-white" />
              {d}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="font-display text-xl text-ink">Întrebări pentru contabil</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>Sunt cheltuielile din profil integral deductibile?</li>
          <li>Trebuie ajustată baza de CAS (12 vs 24 salarii)?</li>
          <li>Intervine plafonul de CASS sau excepția de salariat?</li>
          {profile.tvaPayer ? <li>Perioada de decont TVA și eventuala D300 sunt corecte?</li> : null}
        </ul>
      </section>

      <Footnote extra="Pachetul este o notă de predare, nu o situație contabilă semnată." />
    </Sheet>
  );
}

function DosarEfactura({ profile }: { profile: Profile }) {
  return (
    <Sheet kicker="Dosar educațional de setup" title="e-Factura și SPV">
      <p>
        Ghid de pregătire pentru {displayName(profile)}. Fiscally nu emite e-Factura, nu semnează XML
        și nu se autentifică în SPV.
      </p>
      <section>
        <h3 className="font-display text-xl text-ink">1. Spațiul Privat Virtual</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Obține un certificat digital calificat sau înregistrează-te în SPV cu recunoașterea identității.</li>
          <li>Asociază CUI-ul PFA ({profile.cui || "completează CUI-ul în profil"}) la contul SPV.</li>
          <li>Verifică că primești mesaje ANAF și că poți descărca documente.</li>
        </ol>
      </section>
      <section>
        <h3 className="font-display text-xl text-ink">2. e-Factura (RO e-Factura)</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Confirmă dacă ai obligația de e-Factura B2B (facturi către persoane juridice).</li>
          <li>Alege un program de facturare compatibil (ex. SmartBill) — Fiscally nu înlocuiește acest pas.</li>
          <li>Înrolează CUI-ul în sistemul e-Factura din SPV.</li>
          <li>Testează o factură către un client de încredere și verifică statusul în SPV.</li>
        </ol>
      </section>
      <section>
        <h3 className="font-display text-xl text-ink">Checklist</h3>
        <ul className="space-y-2">
          {[
            "Certificat digital valid",
            "Cont SPV asociat PFA",
            "CUI verificat la ONRC / ANAF",
            "Software de facturare ales",
            "Procedură internă: cine emite și cine arhivează",
            "Backup PDF + XML (când vei emite e-Factura din alt tool)",
          ].map((c) => (
            <li key={c} className="flex gap-2 rounded-xl bg-paper px-3 py-2">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-line bg-white" />
              {c}
            </li>
          ))}
        </ul>
      </section>
      <Footnote extra="Informațiile sunt educaționale și se pot schimba. Verifică anunțurile ANAF." />
    </Sheet>
  );
}

function ContractServicii({ profile }: { profile: Profile }) {
  const value = profile.contractValue || profile.invoiceAmount || 0;
  return (
    <Sheet kicker="Șablon — de personalizat" title="Contract de prestări servicii">
      <p className="text-center font-medium">
        încheiat astăzi, {formatDateRo(todayIso())}
      </p>
      <p>
        <strong>Prestator:</strong> {displayName(profile)}, PFA, CUI {profile.cui || "[CUI]"}, cu sediul
        în {[profile.address, profile.city, profile.county].filter(Boolean).join(", ") || "[adresă]"},
        email {profile.email || "[email]"}, telefon {profile.phone || "[telefon]"}.
      </p>
      <p>
        <strong>Beneficiar:</strong> {profile.clientName || "[Denumire client]"}, CUI{" "}
        {profile.clientCui || "[CUI client]"}, adresa {profile.clientAddress || "[adresa client]"}.
      </p>
      <section>
        <h3 className="font-display text-xl">Art. 1. Obiect</h3>
        <p>
          Prestatorul se obligă să presteze {profile.activityDescription || "servicii profesionale"}
          {profile.caen ? ` (CAEN ${profile.caen})` : ""}, iar Beneficiarul să le recepționeze și să
          le plătească.
        </p>
      </section>
      <section>
        <h3 className="font-display text-xl">Art. 2. Durată</h3>
        <p>Contractul se încheie pe {profile.contractDuration || "12 luni"}, cu posibilitate de prelungire prin act adițional.</p>
      </section>
      <section>
        <h3 className="font-display text-xl">Art. 3. Preț și plată</h3>
        <p>
          Valoarea estimată: <strong>{formatRon(value)}</strong>
          {profile.tvaPayer ? " plus TVA" : ", scutit / neplătitor TVA conform profilului"}. Plata se
          face în 15 zile de la emiterea facturii sau a proformei, în lei, în contul Prestatorului.
        </p>
      </section>
      <section>
        <h3 className="font-display text-xl">Art. 4. Obligațiile părților</h3>
        <p>
          Prestatorul prestează serviciile cu diligență profesională. Beneficiarul pune la dispoziție
          informațiile necesare. Întârzierile cauzate de Beneficiar prelungesc termenele corespunzător.
        </p>
      </section>
      <section>
        <h3 className="font-display text-xl">Art. 5. Proprietate intelectuală</h3>
        <p>
          Livrabilele specifice proiectului se transmit Beneficiarului după plata integrală. Prestatorul
          păstrează know-how-ul, uneltele și componentele generice.
        </p>
      </section>
      <section>
        <h3 className="font-display text-xl">Art. 6. Confidențialitate</h3>
        <p>
          Părțile păstrează confidențialitatea informațiilor primite pe durata contractului și 2 ani
          după încetare, cu excepțiile prevăzute de lege.
        </p>
      </section>
      <section>
        <h3 className="font-display text-xl">Art. 7. Încetare</h3>
        <p>
          Oricare parte poate denunța contractul cu preaviz de 15 zile. Neplata peste 30 de zile
          permite Prestatorului să suspende serviciile.
        </p>
      </section>
      <section>
        <h3 className="font-display text-xl">Art. 8. Legea aplicabilă</h3>
        <p>Contractul este guvernat de legea română. Litigiile se soluționează amiabil, apoi de instanțele competente.</p>
      </section>
      <div className="grid gap-8 pt-6 sm:grid-cols-2">
        <p>
          Prestator,
          <br />
          ______________________
          <br />
          {profile.fullName || "[Nume]"}
        </p>
        <p>
          Beneficiar,
          <br />
          ______________________
          <br />
          {profile.clientName || "[Client]"}
        </p>
      </div>
      <Footnote extra="Șablon generic. Nu este consultanță juridică. Adaptează-l înainte de semnare." />
    </Sheet>
  );
}

function FacturaDraft({ profile }: { profile: Profile }) {
  const amount = profile.invoiceAmount || profile.contractValue || 0;
  const vatRate = profile.tvaPayer ? TAX_CONFIG_2026.tvaStandardRate : 0;
  const vat = amount * vatRate;
  const total = amount + vat;
  const kind = profile.invoiceKind === "factura" ? "FACTURĂ" : "PROFORMĂ";
  return (
    <Sheet kicker="Ciornă internă — nu e e-Factura" title={`${kind} ${profile.invoiceSeries}-${profile.invoiceNumber}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-soft">Furnizor</p>
          <p className="font-medium">{displayName(profile)}</p>
          <p>CUI {profile.cui || "—"}</p>
          <p>{[profile.address, profile.city, profile.county].filter(Boolean).join(", ")}</p>
          <p>{profile.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-soft">Client</p>
          <p className="font-medium">{profile.clientName || "[Client]"}</p>
          <p>CUI {profile.clientCui || "—"}</p>
          <p>{profile.clientAddress || "—"}</p>
        </div>
      </div>
      <p>Data: {formatShortDate(profile.invoiceDate || todayIso())}</p>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-soft">
            <th className="py-2">Descriere</th>
            <th className="py-2 text-right">Valoare</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-line">
            <td className="py-2">{profile.invoiceDescription || "Prestări servicii"}</td>
            <td className="py-2 text-right tabular-nums">{formatRon(amount, true)}</td>
          </tr>
          <tr>
            <td className="py-2">TVA {profile.tvaPayer ? `${Math.round(vatRate * 100)}%` : "neaplicabil"}</td>
            <td className="py-2 text-right tabular-nums">{formatRon(vat, true)}</td>
          </tr>
          <tr>
            <td className="py-2 font-semibold">Total</td>
            <td className="py-2 text-right font-semibold tabular-nums">{formatRon(total, true)}</td>
          </tr>
        </tbody>
      </table>
      <p className="rounded-2xl bg-paper px-3 py-2 text-xs text-ink-soft">
        Document de lucru Fiscally. Nu este e-Factura, nu are semnatură electronică și nu se
        transmite în sistemul ANAF. Folosește un program de facturare pentru documentul fiscal real.
      </p>
    </Sheet>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

function Footnote({ extra }: { extra?: string }) {
  return (
    <footer className="border-t border-line pt-4 text-xs text-ink-soft">
      {extra ? <p className="mb-2">{extra}</p> : null}
      <p>
        Fiscally este un instrument de organizare. Estimările sunt aproximative și nu reprezintă sfat
        fiscal, juridic sau contabil. Aplicația nu depune declarații la ANAF.
      </p>
    </footer>
  );
}
