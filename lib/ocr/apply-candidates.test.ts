import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultDuFlow } from "../du-flow";
import type { IngestCandidate } from "../inbox/types";
import { applyCandidatesToFlow, removeEvidenceFromFlow } from "./apply";

describe("apply classified inbox lines", () => {
  it("adds PFA income and expenses from a mixed batch", () => {
    const batch: IngestCandidate[] = [
      {
        id: "1",
        source: "csv",
        fileName: "a.csv",
        amount: 1000,
        date: "2026-01-01",
        description: "Factura",
        classification: "pfa-income",
        confidence: 0.9,
      },
      {
        id: "2",
        source: "ocr",
        fileName: "b.png",
        amount: 32.5,
        date: "2026-03-12",
        description: "Bon",
        classification: "pfa-expense",
        confidence: 0.8,
      },
    ];
    const next = applyCandidatesToFlow({ ...defaultDuFlow(), role: "pfa" }, batch);
    assert.equal(next.pfaIncome, 1000);
    assert.equal(next.pfaExpenses, 32.5);
    assert.equal(next.evidence.length, 2);
    const after = removeEvidenceFromFlow(next, next.evidence[0].id);
    assert.equal(after.pfaIncome, 0);
  });
});
