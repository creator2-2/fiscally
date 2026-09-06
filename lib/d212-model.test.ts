import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { draftToProfile, mapImportToD212 } from "./d212-model";
import { aggregateImport } from "./smartbill/normalize";
import { parseInvoiceCsv } from "./smartbill/csv";
import { defaultProfile } from "./types";

describe("d212 mapping", () => {
  it("maps imported income and keeps wizard expenses", () => {
    const csv = `date,total,type,status
2026-01-01,50000,factura,emisa
2026-02-01,25000,factura,emisa
2026-03-01,4000,proforma,emisa
`;
    const summary = aggregateImport(parseInvoiceCsv(csv), 2026, "csv", "t");
    const profile = { ...defaultProfile, expenses: 12000, cui: "RO1" };
    const draft = mapImportToD212(profile, summary);
    assert.equal(draft.income.value, 75000);
    assert.equal(draft.income.source, "imported");
    assert.equal(draft.expenses.value, 12000);
    assert.notEqual(draft.expenses.source, "imported");
    const next = draftToProfile(profile, draft);
    assert.equal(next.income, 75000);
    assert.equal(next.expenses, 12000);
    assert.equal(next.fiscalYear, 2026);
  });
});
