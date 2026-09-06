import type { SmartBillApiResult } from "./types";

export function mapSmartBillHttpError(
  status: number,
  errorText: string,
): SmartBillApiResult<never> {
  const text = (errorText || "").trim();
  const lower = text.toLowerCase();

  if (status === 401 || lower.includes("autentificare")) {
    return {
      ok: false,
      code: "AUTH",
      message:
        "Autentificare eșuată. Verifică emailul SmartBill și tokenul API (Contul meu → Integrări → API).",
    };
  }

  if (status === 429 || lower.includes("rate") || lower.includes("prea multe")) {
    return {
      ok: false,
      code: "RATE",
      message:
        "Prea multe cereri. SmartBill limitează API-ul la circa 3 cereri/secundă (30 / 10 s). Dacă ai depășit limita, accesul poate fi blocat câteva minute.",
    };
  }

  if (
    lower.includes("nu mai este disponibila") ||
    lower.includes("nu este disponibila pentru acest utilizator") ||
    lower.includes("companyvatcode") ||
    lower.includes("cif")
  ) {
    return {
      ok: false,
      code: "CIF",
      message:
        "CIF-ul (companyVatCode) nu corespunde firmei din Cloud sau nu ai drepturi pe ea. Folosește CIF-ul exact din Integrări.",
    };
  }

  if (
    status === 403 ||
    lower.includes("nu aveti dreptul") ||
    lower.includes("abonament") ||
    lower.includes("plan") ||
    lower.includes("subscription")
  ) {
    return {
      ok: false,
      code: "PLAN",
      message:
        "Planul SmartBill sau drepturile utilizatorului nu permit API-ul. Verifică abonamentul Cloud și meniul Utilizatori.",
    };
  }

  return {
    ok: false,
    code: "UNKNOWN",
    message: text
      ? `SmartBill a răspuns: ${text}`
      : `Cererea către SmartBill a eșuat (HTTP ${status}).`,
  };
}

export function extractErrorText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const rec = payload as Record<string, unknown>;
  if (typeof rec.errorText === "string") return rec.errorText;
  if (typeof rec.message === "string") return rec.message;
  if (Array.isArray(rec.errors) && rec.errors[0] && typeof rec.errors[0] === "object") {
    const first = rec.errors[0] as Record<string, unknown>;
    if (typeof first.message === "string") return first.message;
  }
  return "";
}
