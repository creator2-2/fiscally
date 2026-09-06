import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeEstimate } from "./tax-engine";
import { defaultProfile } from "./types";

describe("tax engine 2026", () => {
  it("computes a mid-range IT PFA without optional extras", () => {
    const estimate = computeEstimate({
      ...defaultProfile,
      income: 80000,
      expenses: 10000,
      alsoEmployee: false,
      casBaseChoice: "12",
    });
    assert.equal(estimate.netBeforeContributions, 70000);
    assert.equal(estimate.cas, 12150);
    assert.equal(estimate.cass, 7000);
    assert.equal(estimate.incomeTax, 5085);
    assert.equal(estimate.totalSocialAndTax, 24235);
  });

  it("caps CAS at 24 minimum wages", () => {
    const estimate = computeEstimate({
      ...defaultProfile,
      income: 400000,
      expenses: 20000,
    });
    assert.equal(estimate.cas, 24300);
    assert.ok(estimate.cass <= 29160);
  });

  it("skips mandatory CAS under the 12-wage threshold and applies the CASS floor", () => {
    const estimate = computeEstimate({
      ...defaultProfile,
      income: 20000,
      expenses: 2000,
      casOptional: false,
      alsoEmployee: false,
    });
    assert.equal(estimate.netBeforeContributions, 18000);
    assert.equal(estimate.cas, 0);
    assert.equal(estimate.cass, 2430);
  });
});
