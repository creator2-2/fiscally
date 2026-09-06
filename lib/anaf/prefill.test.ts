import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeCombined } from "../combined-tax";
import { emptyD212, flowToD212 } from "../d212-model";
import { defaultDuFlow } from "../du-flow";
import { defaultProfile } from "../types";
import { D212_FIELD_MAP } from "./mapping";
import { ascii, buildPrefillPdf } from "./pdf";
import { PREFILL_SCHEMA, buildPrefillPackage } from "./prefill";
import { anafFormForIncomeYear } from "./registry";

describe("ANAF form registry", () => {
  it("marks 2025 income as the official 2736/2025 edition", () => {
    const form = anafFormForIncomeYear(2025);
    assert.equal(form.status, "official");
    assert.equal(form.formCode, "212");
    assert.ok(form.artifacts.some((a) => a.id === "web-duf" && a.href.includes("anaf.ro")));
    assert.ok(form.artifacts.every((a) => a.href.startsWith("https://")));
  });

  it("marks 2026 income as provisional until the next official order", () => {
    const form = anafFormForIncomeYear(2026);
    assert.equal(form.status, "provisional");
    assert.match(form.notes.join(" "), /2027/);
  });
});

describe("ANAF prefill package", () => {
  it("maps Fiscally review state onto stable anaf keys", () => {
    const flow = {
      ...defaultDuFlow(),
      role: "ambele" as const,
      year: 2026,
      fullName: "Ana Demo",
      cui: "RO123",
      cnp: "1900101123456",
      pfaIncome: 10000,
      pfaExpenses: 1000,
      pfRentalIncome: 24000,
    };
    const profile = { ...defaultProfile, fullName: "Ana Demo" };
    const combined = computeCombined(profile, flow);
    const pkg = buildPrefillPackage(profile, flow, flowToD212(profile, flow, emptyD212(profile)), combined);
    assert.equal(pkg.schema, PREFILL_SCHEMA);
    assert.match(pkg.disclaimer, /Nu este formularul oficial/);
    const names = Object.fromEntries(pkg.fields.map((f) => [f.anafKey, f]));
    assert.equal(names["ident.nume"]?.display, "Ana Demo");
    assert.equal(names["cap1.ai.venit_brut"]?.value, 10000);
    assert.equal(names["cap1.chirii.brut"]?.value, 24000);
    assert.ok(pkg.spvSteps.length >= 4);
    assert.ok(pkg.form.artifacts.find((a) => a.id === "web-duf"));
  });

  it("keeps the field map adapter localized", () => {
    const keys = D212_FIELD_MAP.map((f) => f.anafKey);
    assert.ok(keys.includes("ident.cnp"));
    assert.ok(keys.includes("cap1.ai.venit_brut"));
    assert.equal(new Set(keys).size, keys.length);
  });

  it("builds a downloadable prefill PDF that is not an official form", () => {
    const flow = { ...defaultDuFlow(), role: "pfa" as const, year: 2026, fullName: "Test", pfaIncome: 5000 };
    const profile = defaultProfile;
    const pkg = buildPrefillPackage(profile, flow, null, computeCombined(profile, flow));
    const pdf = buildPrefillPdf(pkg);
    const text = new TextDecoder("latin1").decode(pdf);
    assert.match(text, /%PDF-1.4/);
    assert.match(text, /NU este formularul oficial/);
    assert.match(text, /FISCALLY/);
  });

  it("folds diacritics for Helvetica", () => {
    assert.equal(ascii("șțăîâ ȘȚĂÎÂ"), "staia STAIA");
  });
});
