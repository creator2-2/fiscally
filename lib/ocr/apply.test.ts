import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultDuFlow } from "../du-flow";
import { applyOcrToFlow, removeEvidenceFromFlow } from "./apply";

describe("apply OCR evidence", () => {
  it("adds a PFA expense and subtracts it on delete", () => {
    const added = applyOcrToFlow(
      { ...defaultDuFlow(), role: "pfa", pfaExpenses: 10 },
      {
        label: "chitanta.png",
        amount: 32.5,
        date: "2026-03-12",
        merchant: "Magazin Demo Fiscally",
        confidence: 0.8,
        classification: "pfa-expense",
      },
    );
    assert.equal(added.pfaExpenses, 42.5);
    assert.equal(added.evidence.length, 1);
    assert.equal(added.evidence[0].kind, "ocr");
    const removed = removeEvidenceFromFlow(added, added.evidence[0].id);
    assert.equal(removed.pfaExpenses, 10);
    assert.equal(removed.evidence.length, 0);
  });

  it("maps PF classification to other income", () => {
    const added = applyOcrToFlow(
      { ...defaultDuFlow(), role: "pf" },
      {
        label: "a.png",
        amount: 100,
        date: null,
        merchant: "Chirii",
        confidence: 0.5,
        classification: "pf-income",
      },
    );
    assert.equal(added.pfOtherIncome, 100);
    assert.equal(added.pfaExpenses, 0);
  });

  it("does not change totals for other", () => {
    const added = applyOcrToFlow(
      { ...defaultDuFlow(), role: "pfa", pfaExpenses: 5 },
      {
        label: "a.png",
        amount: 20,
        date: null,
        merchant: "X",
        confidence: 0.4,
        classification: "other",
      },
    );
    assert.equal(added.pfaExpenses, 5);
    assert.equal(added.evidence[0].total, 20);
  });
});
