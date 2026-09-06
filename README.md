# Fiscally

**Pregătește. Exportă. Depune.**

Instrument web pentru PFA din România (servicii, IT, profesii liberale): asistent de profil, estimare fiscală orientativă și fabrică de documente pe care le poți folosi sau preda contabilului.

Complementar cu SmartBill — **nu** este un program de e-Factura și **nu** depune nimic la ANAF.

---

## Faza 2 — Import SmartBill → D212

1. Ia tokenul din SmartBill Cloud: **Contul meu → Integrări → API** (email, token, CIF).
2. În Fiscally: **Importă din SmartBill** (Acasă, Documente sau Cont).
3. Testează conexiunea. Credentialele pleacă per-cerere prin route handlers (`/api/smartbill/connect`, `/api/smartbill/invoices`) — **BFF**: tokenul nu stă pe server și nu e logat.
4. Pe dispozitiv, tokenul e păstrat **criptat (AES-GCM)** în `localStorage`, cu cheie tot locală. E mai bine decât text clar, dar nu e un seif: cine are acces la browser îl poate folosi. Avertismentul apare în UI.
5. Importă anul fiscal. API-ul public V1 **nu listează facturile** (doar serii / taxe / documente individuale). Dacă listarea eșuează, încarcă un **CSV** (coloanele sunt documentate pe ecran) sau folosește `public/examples/smartbill-facturi-2026.csv`.
6. **Revizuiește înainte de D212**: câmpuri importate vs. estimate vs. manuale, tot editabil. Salvezi → Estimări + pachetul Declarația unică se actualizează.

Limită SmartBill: ~3 cereri/secundă (30 / 10 s). Planul Cloud fără API va eșua cu mesaj clar.

### Tradeoff BFF vs. tot-în-browser

Apelurile merg prin Next.js Route Handlers ca tokenul să nu fie trimis din browser **direct** către SmartBill (și ca să evităm CORS). Handlerul **nu persistă** credentialele. Alternativa „doar localStorage + fetch din client” ar expune tokenul în fiecare request cross-origin și e blocată de CORS. Nu pune tokenul în `.env` pentru acest MVP.

### How to get a SmartBill token (EN)

SmartBill Cloud → My account → Integrations → API. Copy email, token, company CIF. Paste into Fiscally. Never commit tokens. CSV fallback works without a live API.

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
- Faza 2: conexiune SmartBill (BFF), import an / CSV, mapare D212, ecran de revizuire
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

- Depunere live în SPV / ANAF (inclusiv după import SmartBill)
- Generare XML Declarație unică sau e-Factura
- Listare nativă a tuturor facturilor prin API V1 (limitare SmartBill — folosim CSV)
- Stocare server-side a tokenurilor SmartBill
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
