import { NextResponse } from "next/server";
import { runWeeklyLegalAuditFromDocument } from "@/src/ai/legal-guardian";
import { normaliseLocale } from "@/src/i18n/get-dictionary";
import type { Property } from "@/src/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = normaliseLocale(searchParams.get("locale") ?? "en");

  return NextResponse.json(await runWeeklyLegalAuditFromDocument(locale));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      locale?: string;
      properties?: Property[];
    };
    const locale = normaliseLocale(body.locale ?? "en");
    const properties = Array.isArray(body.properties) ? body.properties : undefined;

    return NextResponse.json(await runWeeklyLegalAuditFromDocument(locale, properties));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
