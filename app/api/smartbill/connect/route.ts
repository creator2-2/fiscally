import { NextResponse } from "next/server";
import { readCreds, testConnection } from "@/lib/smartbill/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "PARSE", message: "Cererea nu este JSON valid." },
      { status: 400 },
    );
  }

  const creds = readCreds(body);
  if (!creds) {
    return NextResponse.json(
      {
        ok: false,
        code: "MISSING",
        message: "Completează emailul, tokenul API și CIF-ul (companyVatCode).",
      },
      { status: 400 },
    );
  }

  const result = await testConnection(creds.email, creds.token, creds.companyVatCode);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
