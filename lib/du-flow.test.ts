import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyImportToFlow, defaultDuFlow } from "./du-flow";

describe("applyImportToFlow", () => {
  it("maps import to PFA income when the filer is PFA", () => {
    const next = applyImportToFlow(
      { ...defaultDuFlow(), role: "pfa", step: 3 },
      { kind: "csv", label: "a.csv", year: 2026, invoiceCount: 2, total: 15000 },
    );
    assert.equal(next.pfaIncome, 15000);
    assert.equal(next.pfOtherIncome, 0);
    assert.equal(next.evidence.length, 1);
    assert.equal(next.evidence[0].kind, "csv");
  });

  it("maps import to PF other income when the filer is PF only", () => {
    const next = applyImportToFlow(
      { ...defaultDuFlow(), role: "pf", step: 3 },
      { kind: "csv", label: "a.csv", year: 2026, invoiceCount: 2, total: 15000 },
    );
    assert.equal(next.pfOtherIncome, 15000);
    assert.equal(next.pfaIncome, 0);
  });
});
