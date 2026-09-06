import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeCombined, estimateFlow } from "./combined-tax";
import { defaultDuFlow } from "./du-flow";
import { defaultProfile } from "./types";

describe("combined DU estimate", () => {
  it("sums PFA and PF streams for ambele", () => {
    const flow = {
      ...defaultDuFlow(),
      role: "ambele" as const,
      pfaIncome: 80000,
      pfaExpenses: 10000,
      pfRentalIncome: 40000,
      alsoEmployee: true,
    };
    const combined = computeCombined(defaultProfile, flow);
    assert.ok(combined);
    assert.equal(combined.pfa?.netBeforeContributions, 70000);
    assert.equal(combined.pf?.rentalNet, 32000);
    assert.equal(combined.totalIncome, 120000);
    assert.ok(combined.totalDue > (combined.pfa?.totalSocialAndTax ?? 0));
  });

  it("skips PFA when role is pf only", () => {
    const flow = { ...defaultDuFlow(), role: "pf" as const, pfOtherIncome: 10000 };
    const combined = computeCombined(defaultProfile, flow);
    assert.equal(combined?.pfa, null);
    assert.ok(combined?.pf);
  });

  it("falls back to profile when the DU flow has no role yet", () => {
    const profile = {
      ...defaultProfile,
      filerRole: "pf" as const,
      pfRentalIncome: 10000,
      income: 999,
    };
    const combined = computeCombined(profile, estimateFlow(profile, defaultDuFlow()));
    assert.equal(combined?.pfa, null);
    assert.equal(combined?.pf?.rentalGross, 10000);
  });
});
