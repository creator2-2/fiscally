import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractErrorText, mapSmartBillHttpError } from "./errors";

describe("smartbill errors", () => {
  it("maps 401 to AUTH in Romanian", () => {
    const err = mapSmartBillHttpError(401, "Autentificare esuata. Va rugam sa va autentificati din nou");
    assert.equal(err.code, "AUTH");
    assert.match(err.message, /tokenul API/i);
  });

  it("maps rate limits", () => {
    const err = mapSmartBillHttpError(429, "");
    assert.equal(err.code, "RATE");
  });

  it("reads errorText from payload", () => {
    assert.equal(extractErrorText({ errorText: "Firma nu este disponibila" }), "Firma nu este disponibila");
  });
});
