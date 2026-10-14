import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";
import { flowToD212 } from "../d212-model";
import { defaultDuFlow } from "../du-flow";
import { applyCandidatesToFlow, removeEvidenceFromFlow } from "../ocr/apply";
import { defaultProfile } from "../types";
import { parseBankDate, parseBankStatement, parseSignedRoAmount } from "./bank";
import { csvToCandidates } from "./csv";
import { parseWorkbook } from "./excel";

const BT = readFileSync("public/examples/extras-bt-2026.csv", "utf8");

describe("bank statement inbox", () => {
  it("parses signed Romanian amounts and bank dates", () => {
    assert.equal(parseSignedRoAmount("4.500,00"), 4500);
    assert.equal(parseSignedRoAmount("-186.40"), -186.4);
    assert.equal(parseSignedRoAmount("(80,50)"), -80.5);
    assert.equal(parseSignedRoAmount(""), 0);
    assert.equal(parseBankDate("2026-03-01 09:12:00"), "2026-03-01");
    assert.equal(parseBankDate("12.01.2026"), "2026-01-12");
  });

  it("reads the synthetic BT extras", () => {
    const parsed = csvToCandidates(BT, "extras-bt-2026.csv", "pfa-income", 2026);
    assert.equal(parsed.bank, true);
    assert.equal(parsed.candidates.length, 6);
    assert.deepEqual(
      parsed.candidates.map((c) => [c.amount, c.classification, c.date]),
      [
        [4500, "pfa-income", "2026-01-12"],
        [1200, "pfa-expense", "2026-02-03"],
        [15, "pfa-expense", "2026-02-15"],
        [500, "ignore", "2026-03-20"],
        [2000, "pfa-income", "2026-04-02"],
        [900, "ignore", "2025-01-10"],
      ],
    );
    assert.match(parsed.candidates[3].hint ?? "", /conturi proprii/);
    assert.match(parsed.candidates[4].hint ?? "", /venit PFA/);
    assert.match(parsed.candidates[5].hint ?? "", /2026/);
    const asPf = csvToCandidates(BT, "extras-bt-2026.csv", "pfa-income", 2026, true);
    assert.equal(asPf.candidates[4].classification, "pf-income");
    assert.equal(parsed.candidates[0].source, "bank");
  });

  it("keeps PF outflows out of expenses", () => {
    const parsed = parseBankStatement(BT, "extras.csv", "pf-income", 2026);
    assert.ok(parsed);
    const byAmount = Object.fromEntries(parsed.candidates.map((c) => [c.amount, c.classification]));
    assert.equal(byAmount[4500], "pf-income");
    assert.equal(byAmount[1200], "ignore");
    assert.equal(byAmount[15], "ignore");
    assert.equal(byAmount[2000], "pf-income");
  });

  it("parses a Revolut-style signed statement", () => {
    const text = `Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
TRANSFER,Current,2026-03-01 09:12:00,2026-03-02 09:12:00,Payment from Studio Nord,4500.00,0.00,RON,COMPLETED,4500.00
CARD_PAYMENT,Current,2026-03-12 14:02:00,2026-03-12 14:02:00,Dedeman,-186.40,2.00,RON,COMPLETED,4313.60
CARD_PAYMENT,Current,2026-03-13 10:00:00,2026-03-13 10:00:00,Foreign shop,-20.00,1.50,EUR,COMPLETED,100.00
FEE,Current,2026-03-31 00:01:00,2026-03-31 00:01:00,Plan fee,-25.00,0.00,RON,COMPLETED,4288.60
TRANSFER,Current,2026-04-02 11:00:00,2026-04-02 11:00:00,Transfer to savings,-800.00,0.00,RON,COMPLETED,3488.60
CARD_PAYMENT,Current,2026-04-03 08:00:00,2026-04-03 08:00:00,Pending cafe,-12.00,0.00,RON,PENDING,3476.60
`;
    const parsed = parseBankStatement(text, "revolut.csv", "pfa-income", 2026);
    assert.ok(parsed);
    assert.equal(parsed.candidates[0].date, "2026-03-02");
    assert.equal(parsed.candidates[0].classification, "pfa-income");
    assert.equal(parsed.candidates[0].amount, 4500);
    assert.equal(parsed.candidates[1].description, "Dedeman");
    assert.equal(parsed.candidates[1].amount, 186.4);
    assert.equal(parsed.candidates[1].classification, "pfa-expense");
    assert.equal(parsed.candidates[2].description, "Comision · Dedeman");
    assert.equal(parsed.candidates[2].amount, 2);
    assert.match(parsed.candidates[3].hint ?? "", /EUR/);
    assert.equal(parsed.candidates[3].classification, "ignore");
    assert.equal(parsed.candidates[4].classification, "ignore");
    assert.equal(parsed.candidates[5].amount, 25);
    assert.equal(parsed.candidates[5].classification, "pfa-expense");
    assert.equal(parsed.candidates[6].classification, "ignore");
    assert.match(parsed.candidates[7].hint ?? "", /PENDING/);
  });

  it("parses a signed amount plus balance", () => {
    const text = `Data;Descriere;Suma;Sold
12.03.2026;Incasare client;1.250,00;5.000,00
13.03.2026;Plata furnizor;-80,50;4.919,50
`;
    const parsed = parseBankStatement(text, "raiffeisen.csv", "pfa-income", 2026);
    assert.ok(parsed);
    assert.equal(parsed.candidates[0].amount, 1250);
    assert.equal(parsed.candidates[0].classification, "pfa-income");
    assert.equal(parsed.candidates[1].amount, 80.5);
    assert.equal(parsed.candidates[1].classification, "pfa-expense");
  });

  it("nets a row that has both debit and credit", () => {
    const text = `Data;Descriere;Debit;Credit;Sold
01.05.2026;Corectie;100,00;40,00;0
`;
    const parsed = parseBankStatement(text, "net.csv", "pfa-income", 2026);
    assert.ok(parsed);
    assert.equal(parsed.candidates.length, 1);
    assert.equal(parsed.candidates[0].amount, 60);
    assert.equal(parsed.candidates[0].classification, "pfa-expense");
  });

  it("leaves invoice and generic CSV on their own parsers", () => {
    const invoices = csvToCandidates(
      `date,total,type,status
2026-01-01,5000,factura,emisa
`,
      "inv.csv",
      "pfa-income",
    );
    assert.equal(invoices.bank, undefined);
    assert.equal(invoices.candidates[0].source, "csv");
    assert.equal(invoices.candidates[0].classification, "pfa-income");

    const generic = csvToCandidates(
      `data;descriere;suma
15.02.2026;Consultanta;1250,00
`,
      "x.csv",
      "pfa-income",
    );
    assert.equal(generic.bank, undefined);
    assert.equal(generic.candidates[0].source, "csv");
    assert.equal(generic.candidates[0].amount, 1250);
  });

  it("reads an Excel extras, including a sheet after the cover", () => {
    const cover = XLSX.utils.aoa_to_sheet([["PFA Demo"], ["Doar copertă"]]);
    const extras = XLSX.utils.aoa_to_sheet([
      ["Extras de cont"],
      ["Titular", "PFA Demo"],
      ["Data", "Descriere", "Debit", "Credit", "Sold"],
      ["12.03.2026", "Client", "", "100,00", "100,00"],
      ["13.03.2026", "Pix", "20,00", "", "80,00"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, cover, "Coperta");
    XLSX.utils.book_append_sheet(wb, extras, "Extras");
    const raw = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const copy = new ArrayBuffer(raw.byteLength);
    new Uint8Array(copy).set(raw);
    const parsed = parseWorkbook(copy, "extras.xlsx", "pfa-income", 2026);
    assert.equal(parsed.sheet, "Extras");
    assert.equal(parsed.candidates.length, 2);
    assert.equal(parsed.candidates[0].amount, 100);
    assert.equal(parsed.candidates[0].classification, "pfa-income");
    assert.equal(parsed.candidates[1].classification, "pfa-expense");
    assert.equal(parsed.candidates[0].source, "bank");
  });

  it("adds confirmed lines to the flow and removes them again", () => {
    const parsed = csvToCandidates(BT, "extras-bt-2026.csv", "pfa-income", 2026);
    const valid = parsed.candidates.filter((c) => c.classification !== "ignore" && c.amount > 0);
    const flow = applyCandidatesToFlow({ ...defaultDuFlow(), role: "pfa", year: 2026 }, valid);
    assert.equal(flow.pfaIncome, 6500);
    assert.equal(flow.pfaExpenses, 1215);
    assert.equal(flow.pfOtherIncome, 0);
    assert.equal(flow.evidence[0].kind, "bank");
    const draft = flowToD212(defaultProfile, flow);
    assert.equal(draft.income.value, 6500);
    assert.equal(draft.income.source, "imported");
    assert.equal(draft.expenses.source, "imported");
    assert.match(draft.expenses.note ?? "", /extras/);
    assert.notEqual(draft.pfOtherIncome.source, "imported");
    const fee = flow.evidence.find((e) => e.total === 15);
    assert.ok(fee);
    const removed = removeEvidenceFromFlow(flow, fee.id);
    assert.equal(removed.pfaExpenses, 1200);
    assert.equal(removed.evidence.length, valid.length - 1);
  });
});
