import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computePfEstimate } from "./pf-tax";

describe("pf other income 2026", () => {
  it("applies 20% forfait on rental and 10% tax", () => {
    const e = computePfEstimate({
      rentalGross: 40000,
      otherGross: 0,
      otherExpenses: 0,
      alsoEmployee: true,
    });
    assert.equal(e.rentalNet, 32000);
    assert.equal(e.incomeTax, 3200);
    assert.equal(e.cas, 0);
    assert.equal(e.cass, 3200);
  });

  it("nets other income after expenses", () => {
    const e = computePfEstimate({
      rentalGross: 0,
      otherGross: 20000,
      otherExpenses: 5000,
      alsoEmployee: true,
    });
    assert.equal(e.otherNet, 15000);
    assert.equal(e.incomeTax, 1500);
  });
});
