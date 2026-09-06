import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeEstimate } from "./tax-engine";
import { defaultProfile } from "./types";

describe("tax engine 2026", () => {
  it("computes a mid-range IT PFA without optional extras", () => {
    const estimate = computeEstimate({
      ...defaultProfile,
      income: 180000,
      expenses: 24000,
      alsoEmployee: false,
      casBaseChoice: "12",
    });
    assert.equal(estimate.netBeforeContributions, 156000);
    assert.equal(estimate.cas, 12150);
    assert.equal(estimate.cass, 15600);
    assert.equal(estimate.incomeTax, 12825);
    assert.equal(estimate.totalSocialAndTax, 40575);
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

  it("skips mandatory CAS under the 12-wage threshold", () => {
    const estimate = computeEstimate({
      ...defaultProfile,
      income: 40000,
      expenses: 5000,
      casOptional: false,
    });
    assert.equal(estimate.cas, 0);
    assert.equal(estimate.cass, 2430);
  });
});
