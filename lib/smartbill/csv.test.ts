import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parseInvoiceCsv } from "./csv";
import { aggregateImport } from "./normalize";

const SAMPLE = readFileSync("public/examples/smartbill-facturi-2026.csv", "utf8");

describe("smartbill csv", () => {
  it("parses the sample file and excludes proformas from income", () => {
    const invoices = parseInvoiceCsv(SAMPLE);
    assert.equal(invoices.length, 15);
    const summary = aggregateImport(invoices, 2026, "csv", "test");
    assert.equal(summary.invoiceCount, 14);
    assert.equal(summary.includedCount, 13);
    assert.equal(summary.skippedCount, 1);
    assert.equal(summary.totalIncome, 136500);
    assert.ok(summary.months.some((m) => m.month === 6 && m.total === 9000));
  });

  it("accepts Romanian headers and dotted dates", () => {
    const csv = `data,serie,numar,valoare,tva,tip,stare
15.03.2026,AA,1,1000,0,factura,emisa
`;
    const [row] = parseInvoiceCsv(csv);
    assert.equal(row.date, "2026-03-15");
    assert.equal(row.total, 1000);
    assert.equal(row.countsTowardIncome, true);
  });
});
