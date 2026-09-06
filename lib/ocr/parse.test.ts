import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseReceiptText, parseRoAmount, parseRoDate } from "./parse";

const SAMPLE = `CHITANTA
Magazin Demo Fiscally
Str. Exemplu 1, Bucuresti
Data: 12.03.2026
Caiet note          24,50
Pix albastru        8,00
TOTAL               32,50 LEI
Document sintetic de test.
`;

describe("RO receipt parse", () => {
  it("parses Romanian amounts", () => {
    assert.equal(parseRoAmount("32,50"), 32.5);
    assert.equal(parseRoAmount("1.234,56"), 1234.56);
    assert.equal(parseRoAmount("32.50"), 32.5);
  });

  it("parses dotted dates", () => {
    assert.equal(parseRoDate("12.03.2026"), "2026-03-12");
    assert.equal(parseRoDate("1/5/2026"), "2026-05-01");
    assert.equal(parseRoDate("32.13.2026"), null);
  });

  it("picks TOTAL over line items on a synthetic receipt", () => {
    const parsed = parseReceiptText(SAMPLE);
    assert.equal(parsed.amount, 32.5);
    assert.equal(parsed.date, "2026-03-12");
    assert.match(parsed.merchant, /Magazin Demo Fiscally/i);
    assert.ok(parsed.confidence > 0.4);
  });

  it("recovers messy OCR total tokens", () => {
    const parsed = parseReceiptText("T0TAL 89,00 LE1\n12.03.2026");
    assert.equal(parsed.amount, 89);
    assert.equal(parsed.date, "2026-03-12");
  });

  it("does not treat a date as the amount", () => {
    const parsed = parseReceiptText("Data 12.03.2026\nTOTAL 40,00 lei");
    assert.equal(parsed.amount, 40);
  });

  it("returns a low-confidence empty parse when there is no money", () => {
    const parsed = parseReceiptText("hello world no lei here");
    assert.equal(parsed.amount, null);
    assert.ok(parsed.confidence < 0.3);
  });
});
