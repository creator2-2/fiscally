# Fiscally

**Pregătește. Exportă. Depune.**

Instrument web pentru PFA din România (servicii, IT, profesii liberale): asistent de profil, estimare fiscală orientativă și fabrică de documente pe care le poți folosi sau preda contabilului.

Complementar cu SmartBill — **nu** este un program de e-Factura și **nu** depune nimic la ANAF.

---

## Cum rulezi / How to run

```bash
npm install
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000).

Alte comenzi:

```bash
npm run build
npm start
npm test
npm run lint
```

---

## Ce acoperă MVP-ul

- Landing în română, brand calm (sage / mint)
- Asistent în 4 pași: profil PFA, venituri & cheltuieli, TVA + contribuții, recapitulare
- Acasă, Estimări, Documente, Termene, Cont
- Motor fiscal centralizat (`lib/tax-config.ts` + `lib/tax-engine.ts`) cu ipoteze **2026**, etichetate ca aproximative
- Hub de documente:
  1. Situație fiscală (PDF / print)
  2. Pachet ghidat Declarația unică (checklist + date precompletate, **fără XML oficial**)
  3. Pachet lunar pentru contabil
  4. Dosar educațional e-Factura / SPV
  5. Contract prestări servicii PFA
  6. Factură / proformă simplă (draft, nu e-Factura)
- Freemium: wizard, estimare pe ecran, termene, **un** preview de checklist
- Paywall pe Export: plan mock **39 lei/lună** în `localStorage` (fără Netopia / Stripe)
- Disclaimer pe ecranele de sfat / estimare

Datele rămân în browser (`localStorage`).

---

## What this is (EN)

A Romanian-language document factory for sole traders (PFA). Fill a short wizard, see an on-screen tax sketch, export packs for yourself or your accountant. Subscription is a local mock flag. No live ANAF submission, no real payments.

---

## În afara scopului / Out of scope

- Depunere live în SPV / ANAF
- Generare XML Declarație unică sau e-Factura
- Plăți reale (Netopia, Stripe)
- Contabilitate de SRL, magazine, stocuri, salariați
- Sfat fiscal sau juridic autorizat
- Sincronizare cloud / multi-device

---

## Ipoteze fiscale 2026 (orientative)

Configurația din `lib/tax-config.ts` (referință 1 ianuarie 2026):

- Salariu minim de referință: 4.050 lei
- Impozit pe venit: 10% pe (venit net − CAS − CASS)
- CAS 25% dacă venitul net ≥ 12 salarii minime; bază 12 sau 24 salarii
- CASS 10% pe venitul net, cu bază minimă 6 salarii (dacă nu ești și salariat) și plafon 72 salarii

Verifică întotdeauna cu un contabil. Reguli reale se pot schimba.

---

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · persistare `localStorage` · print HTML → PDF din browser
