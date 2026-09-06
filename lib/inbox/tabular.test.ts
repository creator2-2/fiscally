import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyTip, guessColumnMap, parseCsvTable, rowsToCandidates } from "./tabular";
import { csvToCandidates } from "./csv";
import { parseJsonEvidence, parsePlainTextEvidence } from "./text";
import { readFileSync } from "node:fs";
import { routeFile } from "./route";
import { parseWorkbook } from "./excel";

describe("universal inbox parsers", () => {
  it("guesses RO excel/csv headers", () => {
    const map = guessColumnMap(["Data", "Descriere", "Valoare"]);
    assert.ok(map);
    assert.equal(map?.date, 0);
    assert.equal(map?.description, 1);
    assert.equal(map?.amount, 2);
  });

  it("maps table rows to candidates", () => {
    const map = guessColumnMap(["data", "descriere", "suma", "tip"]);
    assert.ok(map);
    const rows = rowsToCandidates(
      ["data", "descriere", "suma", "tip"],
      [["12.03.2026", "Caiet", "32,50", "cheltuiala"]],
      map,
      { source: "xlsx", fileName: "a.xlsx", fallbackClass: "pfa-income" },
    );
    assert.equal(rows[0].amount, 32.5);
    assert.equal(rows[0].date, "2026-03-12");
    assert.equal(rows[0].classification, "pfa-expense");
  });

  it("parses generic CSV via table fallback", () => {
    const text = `data;descriere;valoare
15.02.2026;Consultanta;1250,00
`;
    const table = parseCsvTable(text);
    assert.equal(table.headers[0], "data");
    const parsed = csvToCandidates(text, "x.csv", "pfa-income");
    assert.equal(parsed.needsMapping, false);
    assert.equal(parsed.candidates[0].amount, 1250);
  });

  it("parses invoice CSV into income candidates", () => {
    const text = `date,total,type,status
2026-01-01,5000,factura,emisa
2026-01-02,400,proforma,emisa
`;
    const parsed = csvToCandidates(text, "inv.csv", "pfa-income");
    assert.equal(parsed.candidates.length, 2);
    assert.equal(parsed.candidates[0].classification, "pfa-income");
    assert.equal(parsed.candidates[1].classification, "ignore");
  });

  it("parses JSON evidence", () => {
    const items = parseJsonEvidence(
      JSON.stringify([{ suma: "80,50", data: "12.03.2026", descriere: "Pix" }]),
      "a.json",
      "pfa-expense",
    );
    assert.equal(items[0].amount, 80.5);
    assert.equal(items[0].date, "2026-03-12");
  });

  it("parses a text invoice total", () => {
    const items = parsePlainTextEvidence(
      "FACTURA\nStudio Demo\nData: 15.02.2026\nTOTAL 1.250,00 LEI\n",
      "a.txt",
      "pfa-income",
    );
    assert.equal(items[0].amount, 1250);
    assert.equal(items[0].date, "2026-02-15");
  });

  it("classifies tip hints", () => {
    assert.equal(classifyTip("cheltuiala bon", "pfa-income"), "pfa-expense");
    assert.equal(classifyTip("chirie PF", "pfa-income"), "pf-income");
    assert.equal(classifyTip("proforma", "pfa-income"), "ignore");
  });

  it("routes file names", () => {
    assert.equal(routeFile({ name: "a.PNG", type: "image/png" } as File), "image");
    assert.equal(routeFile({ name: "a.xlsx", type: "" } as File), "xlsx");
    assert.equal(routeFile({ name: "a.bin", type: "" } as File), "unknown");
  });

  it("reads the synthetic xlsx example", () => {
    const buf = readFileSync("public/examples/dovezi-2026.xlsx");
    const parsed = parseWorkbook(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), "dovezi-2026.xlsx", "pfa-income");
    assert.ok(parsed.map);
    assert.equal(parsed.candidates.length, 3);
    assert.equal(parsed.candidates[0].amount, 4500);
    assert.equal(parsed.candidates[1].classification, "pfa-expense");
  });
});
